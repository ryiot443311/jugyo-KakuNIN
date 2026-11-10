import { useEffect, useRef } from 'react';
import { dueNotifications, notificationSupported, showNotification } from '../utils/notify';

const SENT_KEY = 'sent_notifications';

// 同じ通知を二度出さないように、出した通知のキーを覚える（今日の分だけ残す）
const loadSent = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(SENT_KEY)) ?? []); } catch { return new Set(); }
};
const saveSent = (sent, today) => {
  try { sessionStorage.setItem(SENT_KEY, JSON.stringify([...sent].filter(k => k.startsWith(today)))); } catch { /* 保存できなくても続ける */ }
};

// アプリを開いている間（バックグラウンドを含む）、授業の開始前・終了時に通知する
export function useCourseNotifications({ courses, quarters, periods, logs, today, nowMin, notify }) {
  const sent = useRef(null);
  useEffect(() => {
    if (!notificationSupported() || Notification.permission !== 'granted') return;
    if (!sent.current) sent.current = loadSent();
    const due = dueNotifications({ courses, quarters, periods, logs, today, nowMin, notify }).filter(n => !sent.current.has(n.key));
    if (due.length === 0) return;
    due.forEach(n => { sent.current.add(n.key); showNotification(n); });
    saveSent(sent.current, today);
  }, [courses, quarters, periods, logs, today, nowMin, notify]);
}
