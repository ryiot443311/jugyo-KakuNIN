import { useState, useEffect } from 'react';

// localStorage と同期する state（保存は値が変わったときに useEffect で行う）
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (JSON.parse(saved) ?? initialValue) : initialValue;
    } catch {
      return initialValue; // 壊れたデータは初期値で上書きする
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* 容量超過などで保存できない場合は無視 */ }
  }, [key, value]);

  return [value, setValue];
}
