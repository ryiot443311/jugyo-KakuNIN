import { useState, useEffect, useSyncExternalStore } from 'react';

// 保存に失敗したかどうか（画面上部のエラー表示用）
let saveFailed = false;
const listeners = new Set();
const markSaveFailed = () => { saveFailed = true; listeners.forEach(l => l()); };
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const useSaveFailed = () => useSyncExternalStore(subscribe, () => saveFailed);

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
    catch { markSaveFailed(); } // 容量超過・プライベートモードなどで保存できない場合
  }, [key, value]);

  return [value, setValue];
}
