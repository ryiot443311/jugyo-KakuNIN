const MESSAGES = { outOfQuarter: '期間外', future: '未来の日付' };

// 記録できない理由の表示（status: 'outOfQuarter' | 'future'）
export default function RecordNotice({ status, long }) {
  return <div className="notice">{MESSAGES[status]}{long && 'のため記録できません'}</div>;
}
