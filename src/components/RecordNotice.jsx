import { useI18n } from '../i18n';

// 記録できない理由の表示（status: 'outOfQuarter' | 'future'）
export default function RecordNotice({ status, long }) {
  const t = useI18n();
  return <div className="notice">{t.recordNotice(status, long)}</div>;
}
