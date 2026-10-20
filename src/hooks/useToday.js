import { useState, useEffect } from 'react';
import { formatDate } from '../utils/date';

// 今日の日付（'YYYY-MM-DD'）。開いたまま日付が変わっても更新される
export function useToday() {
  const [today, setToday] = useState(() => formatDate(new Date()));

  useEffect(() => {
    const update = () => setToday(formatDate(new Date()));
    const timer = setInterval(update, 60 * 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);

  return today;
}
