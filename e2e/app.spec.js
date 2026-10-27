import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { openApp, log, stored, swipe, download, openGroup, settingsGroup } from './helpers.js'

// サンプルデータ（constants.sample.js）の授業: 水曜3限 英語コミュニケーション(wed-3, 第3・4Q) / 木曜1限 データ構造とアルゴリズム(thu-1, 第3Q)

test.describe('日別画面', () => {
  test('記録・取り消し・連続欠席の注意・スワイプ・メモ・授業の追加', async ({ page }) => {
    await openApp(page, { logs: [log('a1', 'wed-3', '2026-10-07'), log('a2', 'wed-3', '2026-10-14', '欠席'), log('a3', 'wed-3', '2026-10-21', '欠席')] })
    await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')
    await expect(page.locator('.warning')).toHaveText('⚠ 直近2回連続で欠席しています')
    await expect(page.locator('.badge-next')).toHaveText('次の授業')

    // 出席ボタンは下の段、遅刻・欠席・休講は上の段
    const row = await page.locator('.status-row').boundingBox()
    const present = await page.locator('.status-stack > .st-present').boundingBox()
    expect(present.y).toBeGreaterThan(row.y + row.height - 1)

    await swipe(page, 300, 80)
    await expect(page.locator('.date-heading')).toHaveText('10月29日（木）')
    await swipe(page, 80, 300)
    await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')

    await page.click('.status-stack > .st-present')
    await page.click('.modal .btn-primary')
    await expect(page.locator('.course-card .notice')).toHaveText('出席 記録済み')
    await expect(page.locator('.warning')).toHaveCount(0)
    await page.click('.toast button')
    await expect(page.locator('.status-btn')).toHaveCount(4)

    await page.click('.icon-btn')
    await page.fill('#course-memo', '持ち物')
    await page.fill('#date-memo', '教室変更')
    await page.click('text=閉じる')
    await expect(page.locator('.memo')).toHaveText(['持ち物', 'この日: 教室変更'])

    await page.click('text=水曜に授業を追加')
    await page.fill('#course-name', '統計学')
    await page.selectOption('#course-period', '2')
    await page.click('button[type=submit]')
    await expect(page.locator('.course-name')).toContainText(['統計学'])
  })

  test('記録し忘れの授業を知らせ、選ぶとその日へ移動する', async ({ page }) => {
    // 10/14 から使い始め。10/17・10/24(土)、10/21(水)、10/22(木) を記録し忘れ（今日10/28の水曜3限はまだ終わっていない）
    await openApp(page, { logs: [log('b1', 'wed-3', '2026-10-14'), log('b2', 'thu-1', '2026-10-15')], now: '2026-10-28T10:00:00' })
    await expect(page.locator('.unrecorded-banner')).toContainText('記録していない授業が 4件')
    await page.click('.unrecorded-banner')
    await expect(page.locator('.unrecorded-item')).toHaveText([/10\/24（土）2限/, /10\/22（木）1限/, /10\/21（水）3限/, /10\/17（土）2限/])
    await page.locator('.unrecorded-item', { hasText: '10/22（木）1限' }).click()
    await expect(page.locator('.date-heading')).toHaveText('10月22日（木）')
    await page.click('.status-stack > .st-present')
    await page.click('.modal .btn-primary')
    await expect(page.locator('.unrecorded-banner')).toContainText('記録していない授業が 3件')

    // 学期の途中で授業を追加しても、追加する前の週は記録し忘れにならない
    await page.click('text=今日')
    await page.click('text=水曜に授業を追加')
    await page.fill('#course-name', '途中から追加した授業')
    await page.selectOption('#course-period', '1')
    await page.click('button[type=submit]')
    await expect(page.locator('.course-name')).toContainText(['途中から追加した授業'])
    await expect(page.locator('.unrecorded-banner')).toContainText('記録していない授業が 3件')
  })
})

test('週間・履歴・分析', async ({ page }) => {
  await openApp(page, { logs: [
    log('c1', 'wed-3', '2026-10-07'), log('c2', 'wed-3', '2026-10-14', '欠席'), log('c3', 'thu-1', '2026-10-15'),
    log('c4', 'thu-1', '2026-01-15', '出席', 4),
  ] })
  await page.click('.tab:text-is("週間")')
  await page.click('button[aria-label="金曜5限に授業を追加"]')
  await page.fill('#course-name', '実験')
  await page.click('button[type=submit]')
  await expect(page.locator('.weekly-name')).toContainText(['実験'])

  await page.click('.tab:text-is("履歴")')
  await expect(page.locator('.acc-year').first()).toContainText('2026年度')
  await expect(page.locator('.acc-year').nth(1)).toContainText('2025年度')
  await page.locator('.acc-year').nth(1).click()
  await expect(page.locator('.acc-month')).toContainText(['2026年1月'])

  await page.click('.tab:text-is("分析")')
  await expect(page.locator('#analytics-year option')).toHaveText(['2026年度', '2025年度'])
  await expect(page.locator('.stat-card')).toHaveCount(2)
  await expect(page.locator('.chart-card h3')).toHaveText(['週ごとの出席率', '欠席の傾向'])
  await expect(page.locator('.chart-bar')).toHaveCount(2)
  await page.locator('.chart-hit').first().click()
  await expect(page.locator('.chart-card p[aria-live]')).toContainText('10/4〜の週: 100%')
  await expect(page.locator('.hbar-row')).toHaveCount(6)
  await expect(page.locator('.slot-list li')).toHaveText(['水曜3限（英語コミュニケーション）: 1回'])
})

test('設定（テーマ・期間・基準・授業・マップ・施設・CSV・危険な項目）', async ({ page }) => {
  await openApp(page, { logs: [log('d1', 'wed-3', '2026-10-07'), log('d2', 'thu-1', '2026-01-15', '欠席', 4)] })
  await page.click('.tab:text-is("設定")')
  await expect(page.locator('.quarters')).toHaveCount(0)

  await (await openGroup(page, 'テーマ')).locator('button:text-is("ダーク")').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  const month = (await openGroup(page, 'クォーターの期間')).locator('input[aria-label="第3Q終了の月"]')
  await month.fill('12'); await month.blur()
  expect((await stored(page, 'app_settings')).quarters[3].end).toBe('12-31')

  const threshold = (await openGroup(page, '出席率の基準')).locator('input[aria-label="出席率の基準"]')
  await threshold.fill('70'); await threshold.blur()
  expect((await stored(page, 'app_settings')).threshold).toBe(70)

  const courses = await openGroup(page, '授業')
  await expect(courses.locator('.day-group > summary').first()).toHaveText('月曜日（1）')
  await courses.locator('.course-row', { hasText: '英語' }).locator('input').uncheck()
  expect((await stored(page, 'app_settings')).hiddenCourses).toEqual(['wed-3'])

  const map = await openGroup(page, 'マップ')
  await map.locator('text=＋ キャンパスを追加').click()
  await page.fill('#campus-name', '東キャンパス')
  await map.locator('input[type=file]').setInputFiles('public/icon-192.png')
  await expect(map.locator('text=アップロード済み')).toBeVisible()

  const facilities = await openGroup(page, '施設の説明')
  await facilities.locator('button:text-is("東キャンパス")').click()
  await facilities.locator('text=＋ 施設を追加').click()
  await page.fill('input[aria-label="施設名"]', '東1号館')
  await page.fill('input[aria-label="説明"]', '講義室')
  await expect(facilities.locator('button:text-is("削除")')).toHaveCount(0) // 削除は危険な項目から

  await openGroup(page, 'CSV出力')
  const csv = await download(page, 'text=記録の明細')
  expect(csv.startsWith('﻿日付,曜日')).toBe(true)
  expect(csv).toContain('2025年度')

  // 危険な項目: 施設の削除（確認の入力が必要）
  const danger = await openGroup(page, '危険な項目')
  await danger.locator('select[aria-label="施設を削除: キャンパス"]').selectOption({ label: '東キャンパス' })
  await danger.locator('text=この施設を削除').click()
  await expect(page.locator('.modal .btn-danger')).toBeDisabled()
  await page.click('.modal button:text-is("キャンセル")')
  await expect(page.locator('input[aria-label="施設名"]')).toHaveCount(1)
  await danger.locator('text=この施設を削除').click()
  await page.fill('#danger-confirm', '削除')
  await page.click('.modal .btn-danger')
  await expect(page.locator('input[aria-label="施設名"]')).toHaveCount(0)

  // 危険な項目: 出席記録の全削除
  await danger.locator('text=出席記録をすべて削除').click()
  await page.fill('#danger-confirm', '削除')
  await page.click('.modal .btn-danger')
  expect(await stored(page, 'attendance_logs')).toEqual([])

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('バックアップ: 書き出し・置き換え・統合', async ({ page }) => {
  await openApp(page, { logs: [log('e1', 'wed-3', '2026-10-07'), log('e2', 'wed-3', '2026-10-14')] })
  await page.click('.tab:text-is("設定")')
  await openGroup(page, 'データ')
  const backup = JSON.parse(await download(page, 'text=バックアップを書き出す'))
  expect(backup).toMatchObject({ app: 'my-attendance-app', version: 1 })
  expect(backup.data.logs).toHaveLength(2)

  // 別の端末のバックアップ: 10/14 は同じ授業・同じ日（手元を優先）、10/21 は新しい記録
  const other = { ...backup, data: { logs: [log('x1', 'wed-3', '2026-10-14', '欠席'), log('x2', 'wed-3', '2026-10-21', '遅刻')] } }
  const file = path.join(os.tmpdir(), `backup-${Date.now()}.json`)
  fs.writeFileSync(file, JSON.stringify(other))
  const input = settingsGroup(page, 'データ').locator('input[type=file]')

  await input.setInputFiles(file)
  await page.click('.modal button:text-is("統合する")')
  await expect(settingsGroup(page, 'データ').locator('[role=status]')).toContainText('出席記録 1件')
  const merged = await stored(page, 'attendance_logs')
  expect(merged.map(l => `${l.date}:${l.status}`).sort()).toEqual(['2026-10-07:出席', '2026-10-14:出席', '2026-10-21:遅刻'])

  await input.setInputFiles(file)
  await page.click('.modal button:text-is("置き換える")')
  expect((await stored(page, 'attendance_logs')).map(l => l.id).sort()).toEqual(['x1', 'x2'])
  fs.rmSync(file)
})

test('オフラインで起動できる・CSP 違反やエラーがない', async ({ page, context }) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()) })
  await openApp(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.app-title')).toHaveText('授業管理アプリ')
  await page.click('.tab:text-is("設定")')
  await expect(page.locator('summary:text-is("危険な項目")')).toBeVisible()
  await context.setOffline(false)
  expect(errors).toEqual([])
})
