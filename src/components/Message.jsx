// 操作の結果のメッセージ（アプリ共通）。message: { ok, text }。ok が false ならエラー、未指定なら案内
// 成功・案内は role=status、エラーは role=alert で読み上げる
export default function Message({ message, className = '' }) {
  if (!message?.text) return null;
  const tone = message.ok === true ? ' ok-text' : message.ok === false ? ' danger-text' : '';
  return <p className={`small message${tone}${className ? ` ${className}` : ''}`} role={message.ok === false ? 'alert' : 'status'}>{message.text}</p>;
}
