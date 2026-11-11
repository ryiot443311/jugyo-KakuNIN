import { useState, useEffect, useRef, useCallback } from 'react';
import { loadValue, saveValue } from '../data/imageStore';
import { markSaveFailed } from './useLocalStorageState';

// IndexedDB と同期する state（読み込みは非同期。読み込みが終わるまで loaded は false）
// normalize は保存データの検証。不正なら例外を投げると初期値に戻る
export function useStoredState(key, initialValue, normalize = (v) => v) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const dirty = useRef(false); // 読み込み前に変更されたら、読み込んだ値で上書きしない
  const normalizeRef = useRef(normalize);
  const valueRef = useRef(value);

  useEffect(() => {
    let alive = true;
    loadValue(key).then((saved) => {
      if (!alive || dirty.current || saved === undefined) return;
      try {
        const v = normalizeRef.current(saved) ?? initialValue;
        valueRef.current = v;
        setValue(v);
      } catch { /* 壊れたデータは初期値のまま */ }
    }).finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((next) => {
    dirty.current = true;
    const v = typeof next === 'function' ? next(valueRef.current) : next;
    valueRef.current = v;
    setValue(v);
    saveValue(key, v).catch(markSaveFailed);
  }, [key]);

  return [value, update, loaded];
}
