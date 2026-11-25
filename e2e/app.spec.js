import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { openApp, log, stored, storedInDb, swipe, download, openGroup, settingsGroup, openView } from './helpers.js'

// サンプルデータ（constants.sample.js）の授業: 水曜3限 英語コミュニケーション(wed-3, 第3・4Q) / 木曜1限 データ構造とアルゴリズム(thu-1, 第3Q)

test.describe('日別画面', () => {
  test('記録・取り消し・連続欠席の注意・スワイプ・メモ・授業の追加', async ({ page }) => {
    await openApp(page, { logs: [log('a1', 'wed-3', '2026-10-07'), log('a2', 'wed-3', '2026-10-14', '欠席'), log('a3', 'wed-3', '2026-10-21', '欠席')] })
    await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')
    await expect(page.locator('.warning')).toHaveText('⚠ 直近2回連続で欠席しています')
    await expect(page.locator('.badge-next')).toHaveText('次の授業')

    // 出席ボタンは左端、遅刻・欠席・休講はその右に並ぶ
    const row = await page.locator('.status-row').boundingBox()
    const present = await page.locator('.status-stack > .st-present').boundingBox()
    expect(present.x + present.width).toBeLessThanOrEqual(row.x + 1)

    await swipe(page, 300, 80)
    await expect(page.locator('.date-heading')).toHaveText('10月29日（木）')
    await swipe(page, 80, 300)
    await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')

    await page.click('.status-stack > .st-present')
    await page.click('.modal .btn-primary')
    await expect(page.locator('.course-card .notice')).toContainText('出席 記録済み')
    await expect(page.locator('.warning')).toHaveCount(0)
    await page.click('.toast button:text-is("元に戻す")')
    await expect(page.locator('.status-btn')).toHaveCount(4)

    // 記録の表示は画面上部に出て、左右スワイプで消せる（日付は変わらない）
    await page.click('.status-stack > .st-present')
    await page.click('.modal .btn-primary')
    const toast = await page.locator('.toast').boundingBox()
    expect(toast.y).toBeLessThan(100)
    await swipe(page, toast.x + toast.width / 2, toast.x + toast.width / 2 + 150, toast.y + toast.height / 2)
    await expect(page.locator('.toast')).toHaveCount(0)
    await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')
    await expect(page.locator('.course-card .notice')).toContainText('出席 記録済み') // 消しても記録は残る
    await openView(page, '履歴')
    await page.click('.acc-dayhead >> nth=0')
    await page.locator('.log-card', { hasText: '英語' }).locator('button:text-is("修正")').click()
    await page.click('.modal button:text-is("記録を削除")')
    await page.click('.modal .btn-danger')
    await page.click('.tab:text-is("日別")')
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

    // 隔週の授業: 10/28 は第3Qの第9週（奇数週）なので、偶数週の授業は前の週（第8週）にだけ出る
    await page.click('text=水曜に授業を追加')
    await page.fill('#course-name', '輪講')
    await page.click('label.check:has-text("偶数週")')
    await page.click('button[type=submit]')
    await expect(page.locator('.course-name', { hasText: '輪講' })).toHaveCount(0)
    await page.click('text=◀ 前の週')
    await expect(page.locator('.course-name', { hasText: '輪講' })).toHaveText('輪講偶数週')
    await page.click('.tab:text-is("週間")')
    await expect(page.locator('.weekly-course', { hasText: '輪講' })).toContainText('偶数週')
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

test('開いたまま日付が変わると、今日の表示が新しい日に移る（ほかの日を見ているときは移らない）', async ({ page }) => {
  await openApp(page, { now: '2026-10-28T23:59:00' })
  await expect(page.locator('.date-heading')).toHaveText('10月28日（水）今日')
  await page.clock.runFor(120_000)
  await expect(page.locator('.date-heading')).toHaveText('10月29日（木）今日')
  await page.click('text=◀ 前の週')
  await page.clock.fastForward('24:00:00')
  await expect(page.locator('.date-heading')).toHaveText('10月22日（木）')
  await page.click('button:text-is("今日")')
  await expect(page.locator('.date-heading')).toHaveText('10月30日（金）今日')
})

test('課題: 授業詳細で登録し、期限が近いものを日別画面に出す', async ({ page }) => {
  await openApp(page)
  await page.click('.icon-btn')
  await page.fill('input[aria-label="課題名"]', 'レポート')
  await page.fill('input[aria-label="期限"]', '2026-10-30')
  await page.click('.modal button:text-is("追加")')
  await page.fill('input[aria-label="課題名"]', '期末課題')
  await page.fill('input[aria-label="期限"]', '2026-11-20')
  await page.click('.modal button:text-is("追加")')
  await expect(page.locator('.modal .task-item')).toHaveText([/レポート.*あと2日/, /期末課題.*あと23日/])
  await page.click('.modal button:text-is("閉じる")')

  // 7日以内のものだけ日別画面に出る。完了にすると消える
  await expect(page.locator('.task-banner .task-item')).toHaveCount(1)
  await expect(page.locator('.task-banner')).toContainText('英語コミュニケーション')
  await expect(page.locator('.task-banner .task-group-title')).toHaveText(['11/4（水）まで'])
  // 先の日を選ぶと、その日を基準に出す
  for (let i = 0; i < 3; i++) await page.click('text=次の週 ▶')
  await expect(page.locator('.task-banner .task-group-title')).toHaveText(['11/18（水）まで選んだ日', '11/25（水）まで'])
  await expect(page.locator('.task-banner .task-item')).toHaveText([/レポート/, /期末課題.*あと23日/])
  await page.click('button:text-is("今日")')
  await page.click('.task-banner input[type=checkbox]')
  await expect(page.locator('.task-banner')).toHaveCount(0)
  expect((await stored(page, 'course_tasks')).map(t => `${t.title}:${t.done}`)).toEqual(['レポート:true', '期末課題:false'])

  await page.click('.icon-btn')
  await expect(page.locator('.modal .task-item.is-done')).toContainText('レポート')
  await page.click('.modal button[aria-label="課題「レポート」を削除"]')
  await expect(page.locator('.modal .task-item')).toHaveCount(1)
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

  await openView(page, '履歴')
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
  await openView(page, '設定')
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

test('通知: 授業開始の10分前に知らせる・カレンダーに書き出す', async ({ page, context }) => {
  await context.grantPermissions(['notifications'])
  // 表示した通知を記録する（Service Worker 経由・直接のどちらでも）
  await page.addInitScript(() => {
    window.__shown = []
    const record = (title) => window.__shown.push(title)
    if (window.ServiceWorkerRegistration) ServiceWorkerRegistration.prototype.showNotification = async function (title) { record(title) }
    window.Notification = class { static permission = 'granted'; static requestPermission = async () => 'granted'; constructor(title) { record(title) } }
  })
  await openApp(page, { now: '2026-10-28T12:48:30' }) // 英語コミュニケーションは水曜3限（13:00〜）
  await openView(page, '設定')
  const group = await openGroup(page, '通知・カレンダー')
  await group.locator('text=授業開始の10分前に知らせる').click()
  expect((await stored(page, 'app_settings')).notify).toEqual({ before: true, after: false })
  expect(await page.evaluate(() => window.__shown)).toEqual([])
  await page.clock.runFor(90_000) // 12:50 になる
  await expect.poll(() => page.evaluate(() => window.__shown)).toEqual(['まもなく 英語コミュニケーション'])
  await page.clock.runFor(60_000) // 同じ通知は二度出さない
  expect(await page.evaluate(() => window.__shown)).toHaveLength(1)

  const ics = await download(page, '.settings-group button:text-is("書き出す")')
  expect(ics).toContain('BEGIN:VCALENDAR')
  expect(ics).toContain('SUMMARY:英語コミュニケーション')
  expect(ics).toContain('TRIGGER:-PT10M')
  await expect(group.locator('[role=status]')).toContainText('予定を書き出しました')
})

test('バックアップ: 書き出し・置き換え・統合', async ({ page }) => {
  await openApp(page, { logs: [log('e1', 'wed-3', '2026-10-07'), log('e2', 'wed-3', '2026-10-14')] })
  await openView(page, '設定')
  await openGroup(page, 'データ')
  const backup = JSON.parse(await download(page, '.settings-group:has(summary:text-is("データ")) button:text-is("バックアップを書き出す")'))
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

test('マップ画像: 以前の localStorage の画像を IndexedDB に移し、再読み込み後も表示する', async ({ page }) => {
  const png = `data:image/png;base64,${fs.readFileSync('public/icon-192.png').toString('base64')}`
  await openApp(page, { extra: { campus_images: { north: png } } })
  await openView(page, 'マップ')
  await expect(page.locator('img.map-img')).toHaveAttribute('src', png)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('campus_images'))).toBeNull()
  expect(await storedInDb(page, 'campus_images')).toEqual({ north: png })
  await page.reload()
  await openView(page, 'マップ')
  await expect(page.locator('img.map-img')).toHaveAttribute('src', png)

  // 設定から削除すると、再読み込み後も消えたまま
  await openView(page, '設定')
  await (await openGroup(page, 'マップ')).locator('text=画像を削除').click()
  await expect.poll(() => storedInDb(page, 'campus_images')).toEqual({})
  await page.reload()
  await openView(page, 'マップ')
  await expect(page.locator('h2.app-title')).toBeVisible()
  await expect(page.locator(`img[src="${png}"]`)).toHaveCount(0)
})

test('学年暦: 休校日・補講を登録すると、日別画面と記録し忘れに反映する', async ({ page }) => {
  await openApp(page, { logs: [log('a1', 'wed-3', '2026-10-14'), log('a2', 'thu-1', '2026-10-15'), log('a3', 'sat-2', '2026-10-17'), log('a4', 'sat-2', '2026-10-24')] })
  await expect(page.locator('.unrecorded-banner')).toContainText('2件') // 10/21(水)・10/22(木)
  await openView(page, '設定')
  const group = await openGroup(page, '休校日・振替・補講')
  await group.getByLabel('休校日の始まり').fill('2026-10-21')
  await group.getByLabel('休校日の終わり').fill('2026-10-22')
  await group.getByLabel('名前・メモ').fill('大学祭')
  await group.getByRole('button', { name: '＋ 登録する' }).click()
  await group.getByRole('button', { name: '補講' }).click()
  await group.getByLabel('補講の日付').fill('2026-10-30')
  await group.getByLabel('補講の授業').selectOption('thu-1')
  await group.getByLabel('補講の時限').selectOption('2')
  await group.getByRole('button', { name: '＋ 登録する' }).click()
  await expect(group.locator('.calendar-item')).toHaveCount(2)
  expect((await stored(page, 'school_calendar')).map(e => e.type)).toEqual(['holiday', 'makeup'])

  await openView(page, '日別')
  await expect(page.locator('.unrecorded-banner')).toHaveCount(0) // 休校日の授業は数えない
  await page.click('.day-tab:has(.day-tab-day:text-is("金"))')
  await expect(page.locator('.course-card .course-name')).toHaveText('データ構造とアルゴリズム補講')
  await expect(page.locator('.course-card .course-meta')).toContainText('2限')
  await page.click('button:text-is("◀ 前の週")')
  await page.click('.day-tab:has(.day-tab-day:text-is("水"))')
  await expect(page.locator('.day-note')).toHaveText('休校日（大学祭）')
  await expect(page.locator('.empty')).toHaveText('休校日のため授業なし')
})

test('週間表に学年暦を反映し、授業詳細から補講を追加できる・目次から設定の項目を開ける', async ({ page }) => {
  await openApp(page, {
    extra: { school_calendar: [
      { id: 'h1', type: 'holiday', start: '2026-10-29', end: '2026-10-29', name: '' }, // 木
      { id: 's1', type: 'swap', date: '2026-10-30', dayOfWeek: 3, name: '' }, // 金曜に水曜の授業
    ] },
  })
  // 授業詳細から補講を追加（10/31 土 4限）
  await page.click('.course-card .icon-btn')
  const box = page.locator('.modal .makeup-box')
  await box.locator('summary').click()
  await box.getByLabel('補講の日付').fill('2026-10-28')
  await box.getByRole('button', { name: '＋ 補講を登録' }).click()
  await expect(box.locator('[role=alert]')).toContainText('すでにこの授業があります')
  await box.getByLabel('補講の日付').fill('2026-10-31')
  await box.getByLabel('補講の時限').selectOption('4')
  await box.getByRole('button', { name: '＋ 補講を登録' }).click()
  await expect(box.locator('[role=status]')).toHaveText('10/31（土） 4限に補講を登録しました。')
  await expect(box.locator('.calendar-item')).toHaveCount(1)
  await page.click('.modal button:text-is("閉じる")')

  await openView(page, '週間')
  const col = (n) => page.locator(`.weekly tbody tr:nth-child(${n})`)
  await expect(page.locator('.weekly th.is-holiday')).toContainText('休校')
  await expect(page.locator('.weekly th').nth(5)).toContainText('水曜') // 金曜の列（振替）
  await expect(col(1).locator('td').nth(4)).toContainText('データ構造とアルゴリズム') // 木1限（休校）
  await expect(col(1).locator('td').nth(4).locator('.weekly-course.is-off')).toHaveCount(1)
  await expect(col(3).locator('td').nth(5)).toContainText('英語コミュニケーション') // 金3限（水曜の授業）
  await expect(col(4).locator('td').nth(6)).toContainText('補講') // 土4限

  // 目次の節から、設定の項目を開いた状態で表示する
  await openView(page, '目次')
  await expect(page.locator('.toc-section').first()).toContainText('次の休校日: 10/29（木）')
  await page.click('.toc-section:has(.toc-label:text-is("バックアップ"))')
  await expect(page.locator('.settings-group:has(summary:text-is("データ"))')).toHaveAttribute('open', '')
  await expect(page.locator('.settings-heading')).toHaveText(['時間割', '表示・通知', 'キャンパス', 'データ'])
})

test('漢字フォントは、画面で使う文字を含むファイルだけを読み込む', async ({ page }) => {
  const fonts = []
  page.on('request', r => { const m = r.url().match(/techo-mincho-kanji-(\d+)-/); if (m) fonts.push(m[1]) })
  await openApp(page)
  await expect(page.locator('.course-card').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  expect([...new Set(fonts)]).toEqual(['00'])
})

test('ホーム画面のショートカット: ?view= で開く画面を選べる（不正な値は日別）', async ({ page }) => {
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest.shortcuts.map(s => s.url)).toEqual(['/?view=home', '/?view=weekly', '/?view=analytics'])
  await openApp(page, { path: '/?view=weekly' })
  await expect(page.locator('.tab[aria-current=page]')).toHaveText('週間')
  await page.goto('/?view=analytics')
  await expect(page.locator('.tab[aria-current=page]')).toHaveText('分析')
  await page.goto('/?view=unknown')
  await expect(page.locator('.tab[aria-current=page]')).toHaveText('日別')
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
  await openView(page, '設定')
  await expect(page.locator('summary:text-is("危険な項目")')).toBeVisible()
  await context.setOffline(false)
  expect(errors).toEqual([])
})

test('非表示の授業: 授業がない日に知らせ、設定の「授業」からすべて表示に戻せる', async ({ page }) => {
  await openApp(page, { settings: { hiddenCourses: ['wed-3'] } })
  await expect(page.locator('.empty')).toHaveText('本日の授業なし')
  await expect(page.locator('.hidden-note')).toContainText('この日の授業 1件 を非表示にしています（英語コミュニケーション）')
  await page.click('.hidden-note')
  await page.click('button:text-is("すべて表示に戻す")')
  await page.click('.tab:text-is("日別")')
  await expect(page.locator('.course-name')).toContainText(['英語コミュニケーション'])
  await expect(page.locator('.hidden-note')).toHaveCount(0)
})
