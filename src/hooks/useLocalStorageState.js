import { useState, useEffect, useRef, useSyncExternalStore } from 'react';

// 保存に失敗したかどうか（画面上部のエラー表示用）
let saveFailed = false;
const listeners = new Set();
const markSaveFailed = () => { saveFailed = true; listeners.forEach(l => l()); };
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const useSaveFailed = () => useSyncExternalStore(subscribe, () => saveFailed);

// localStorage と同期する state（保存は値が変わったときに useEffect で行う）
// normalize は保存データの検証。不正なら例外を投げると初期値に戻る
export function useLocalStorageState(key, initialValue, normalize = (v) => v) {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? (normalize(JSON.parse(saved)) ?? initialValue) : initialValue;
    } catch {
      return initialValue; // 壊れたデータは初期値で上書きする
    }
  });

  useEffect(() => {
    if (value === initialRef.current) return; // 一度も変更していない初期値は保存しない（初期データの更新が反映される）
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { markSaveFailed(); } // 容量超過・プライベートモードなどで保存できない場合
  }, [key, value]);

  return [value, setValue];
}
