import fs from 'node:fs'

// テスト用の初期データを localStorage に入れ、時計を固定してから開く
export async function openApp(page, { logs = [], settings, now = '2026-10-28T10:00:00', path = '/' } = {}) {
  await page.addInitScript(({ logs, settings }) => {
    if (sessionStorage.getItem('seeded')) return // 再読み込みでは上書きしない
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('attendance_logs', JSON.stringify(logs))
    if (settings) localStorage.setItem('app_settings', JSON.stringify(settings))
  }, { logs, settings })
  await page.clock.install({ time: new Date(now) })
  await page.goto(path)
}

export const log = (id, courseId, date, status = '出席', quarter = 3) => ({ id, courseId, date, recordedAt: `${date} 10:00`, status, quarter })

// localStorage の値を読む（保存は描画のあとに行われるので、反映を待つ）
export async function stored(page, key) {
  await page.waitForTimeout(300)
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key)
}

// 横スワイプ（タッチ操作）
export async function swipe(page, fromX, toX, y = 450) {
  const cdp = await page.context().newCDPSession(page)
  for (const [type, x] of [['touchStart', fromX], ['touchMove', (fromX + toX) / 2], ['touchMove', toX]]) {
    await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [{ x, y }] })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

// ダウンロードしたファイルの中身
export async function download(page, clickTarget) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.click(clickTarget)])
  return fs.readFileSync(await file.path(), 'utf8')
}

export const settingsGroup = (page, title) => page.locator('.settings-group', { has: page.locator(`summary:text-is("${title}")`) })
export async function openGroup(page, title) {
  const group = settingsGroup(page, title)
  if (!(await group.evaluate(el => el.open))) await group.locator(':scope > summary').click()
  return group
}
