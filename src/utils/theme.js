// テーマを <html data-theme> に反映する（'auto' は属性を外して OS の設定に従う）
export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  else delete root.dataset.theme;
}
