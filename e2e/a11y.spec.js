import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { openApp, log, openGroup } from './helpers.js'

// 画面ごとに axe でアクセシビリティを検査する（WCAG 2.1 A / AA）
const check = async (page, name) => {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = result.violations.map(v => `${name}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
  expect(summary).toEqual([])
}

for (const theme of ['light', 'dark']) {
  test(`アクセシビリティ（${theme}）`, async ({ page }) => {
    await openApp(page, {
      settings: { theme },
      logs: [log('a1', 'wed-3', '2026-10-07'), log('a2', 'wed-3', '2026-10-14', '欠席'), log('a3', 'wed-3', '2026-10-21', '遅刻'), log('a4', 'thu-1', '2026-10-22', '休講')],
      extra: { course_tasks: [{ id: 't1', courseId: 'wed-3', title: 'レポート', due: '2026-10-27', done: false }, { id: 't2', courseId: 'wed-3', title: '小テスト', due: '2026-10-30', done: true }] },
    })
    await check(page, '日別（課題・記録し忘れ・連続欠席）')
    await page.click('.icon-btn')
    await check(page, '授業詳細')
    await page.click('.modal button:text-is("授業情報を編集")')
    await check(page, '授業の編集')
    await page.click('.modal button:text-is("キャンセル")')
    await page.click('.unrecorded-banner')
    await check(page, '記録し忘れ')
    await page.click('.modal button:text-is("閉じる")')
    await page.click('.status-stack > .st-present')
    await check(page, '記録の確認')
    await page.click('.modal .btn-primary')
    await check(page, '元に戻す')
    await page.click('.toast-close')
    for (const tab of ['週間', '履歴', '分析', 'マップ']) {
      await page.click(`.tab:text-is("${tab}")`)
      await check(page, tab)
    }
    await page.click('.tab:text-is("設定")')
    for (const g of ['テーマ', '授業', 'マップ', '出席率の基準', 'クォーターの期間', '時限の時間', '通知・カレンダー', 'CSV出力', 'アプリとして使う', 'データ', '危険な項目']) await openGroup(page, g)
    await check(page, '設定')
  })
}

test('キーボード: ダイアログ内でフォーカスが巡回し、Esc で閉じて元のボタンに戻る', async ({ page }) => {
  await openApp(page)
  await page.focus('.icon-btn')
  await page.keyboard.press('Enter')
  const dialog = page.locator('[role=dialog]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAccessibleName('授業詳細')
  const visited = new Set()
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab')
    const { inside, name } = await page.evaluate(() => ({ inside: !!document.activeElement.closest('[role=dialog]'), name: document.activeElement.id || document.activeElement.textContent }))
    expect(inside).toBe(true)
    visited.add(name)
  }
  // メモ欄から先へ進み、最後の「閉じる」まで巡回している
  expect([...visited]).toEqual(expect.arrayContaining(['course-memo', 'date-memo', '授業情報を編集', '閉じる']))
  await page.keyboard.press('Shift+Tab')
  expect(await page.evaluate(() => !!document.activeElement.closest('[role=dialog]'))).toBe(true)

  // Esc で閉じても、入力したメモは保存される
  await page.fill('#course-memo', 'Escで閉じる')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.icon-btn')).toBeFocused()
  await expect(page.locator('.memo')).toHaveText('Escで閉じる')
})

test('記録の表示は × ボタンでも消せる（スワイプの代わり）', async ({ page }) => {
  await openApp(page)
  await page.click('.status-stack > .st-present')
  await page.keyboard.press('Escape') // 確認ダイアログは Esc で取り消せる
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
  await expect(page.locator('.status-btn')).toHaveCount(4)
  await page.click('.status-stack > .st-present')
  await page.click('.modal .btn-primary')
  await page.click('.toast-close')
  await expect(page.locator('.toast')).toHaveCount(0)
  await expect(page.locator('.course-card .notice')).toHaveText('出席 記録済み')
})
