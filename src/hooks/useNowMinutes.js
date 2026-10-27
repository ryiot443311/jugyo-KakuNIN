import { useState, useEffect } from 'react';

const getNowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

// 現在時刻（0:00 からの経過分）。授業中・次の授業の判定に使う
export function useNowMinutes() {
  const [minutes, setMinutes] = useState(getNowMinutes);

  useEffect(() => {
    const update = () => setMinutes(getNowMinutes());
    const timer = setInterval(update, 30 * 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);

  return minutes;
}
