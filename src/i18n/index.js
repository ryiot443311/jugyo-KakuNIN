import { createContext, useContext } from 'react';
import { ja, en } from './messages';

export const LANGS = [
  { id: 'ja', label: '日本語' },
  { id: 'en', label: 'English' },
];

const MESSAGES = { ja, en };

// 言語 id の文言（不明な id は日本語）
export const getMessages = (lang) => MESSAGES[lang] ?? ja;

export const I18nContext = createContext(ja);

// 画面の文言。App の Provider の外（テストなど）では日本語
export const useI18n = () => useContext(I18nContext);

// <html lang> とタブのタイトルを言語に合わせる
export function applyLang(lang) {
  const t = getMessages(lang);
  document.documentElement.lang = t.lang;
  document.title = t.appTitle;
}
