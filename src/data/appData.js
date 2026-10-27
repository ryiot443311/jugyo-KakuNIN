import { MY_COURSES, CAMPUSES, CAMPUS_BUILDINGS } from './constants';

// 保存キー。courses・campus_buildings は以前のバージョンと同じ形式（既存データをそのまま読める）
export const COURSES_KEY = 'courses';
export const CAMPUSES_KEY = 'campuses';
export const BUILDINGS_KEY = 'campus_buildings';
export const IMAGES_KEY = 'campus_images';

export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const isText = (v) => typeof v === 'string';
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isQuarter = (q) => Number.isInteger(q) && q >= 1 && q <= 4;
// quarter は 1〜4 の数値、または空でない配列。未指定は全クォーター
const toQuarter = (q) => (isQuarter(q) || (Array.isArray(q) && q.length > 0 && q.every(isQuarter)) ? q : undefined);

// id が重複したものは先頭だけ残す
const sanitizeList = (list, sanitize) => {
  const seen = new Set();
  return list.map(sanitize).filter(item => item && !seen.has(item.id) && seen.add(item.id));
};

const sanitizeCourse = (c) => {
  if (!isObject(c) || !isText(c.id) || !isText(c.name) || c.name.trim() === '') return null;
  if (!Number.isInteger(c.dayOfWeek) || c.dayOfWeek < 0 || c.dayOfWeek > 6 || !Number.isInteger(c.period) || c.period < 1) return null;
  return {
    id: c.id, name: c.name, quarter: toQuarter(c.quarter), dayOfWeek: c.dayOfWeek, period: c.period,
    campus: isText(c.campus) ? c.campus : '', room: isText(c.room) ? c.room : '', teacher: isText(c.teacher) ? c.teacher : '',
    // 画面から追加した日（記録し忘れの検出で、追加より前の授業を数えないため）
    ...(isText(c.createdAt) && /^\d{4}-\d{2}-\d{2}$/.test(c.createdAt) ? { createdAt: c.createdAt } : {}),
  };
};

// 画像の場所は、このアプリ内のパス（/ で始まる。// は外部サイトになるので除く）か data:image のみ
export const isSafeImagePath = (v) => isText(v) && (/^\/(?!\/)/.test(v) || v.startsWith('data:image/'));

const sanitizeCampus = (c) => (isObject(c) && isText(c.id) && isText(c.name) ? { id: c.id, name: c.name, mapImage: isSafeImagePath(c.mapImage) ? c.mapImage : null } : null);

const sanitizeBuilding = (b) => (isObject(b) && isText(b.id) ? { id: b.id, name: isText(b.name) ? b.name : '', description: isText(b.description) ? b.description : '' } : null);

const sanitizeBuildingsMap = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, list]) => Array.isArray(list)).map(([campusId, list]) => [campusId, sanitizeList(list, sanitizeBuilding)])
);

const requireArray = (v) => { if (!Array.isArray(v)) throw new Error('not an array'); return v; };
const requireObject = (v) => { if (!isObject(v)) throw new Error('not an object'); return v; };
export const sanitizeCourses = (arr) => sanitizeList(requireArray(arr), sanitizeCourse);
export const sanitizeCampuses = (arr) => sanitizeList(requireArray(arr), sanitizeCampus);
export const sanitizeBuildings = (obj) => sanitizeBuildingsMap(requireObject(obj));

// localStorage の授業・キャンパス情報を返す。未保存の項目は constants.js の初期データになる
export function resolveAppData(saved) {
  const s = isObject(saved) ? saved : {};
  return {
    courses: Array.isArray(s.courses) ? sanitizeList(s.courses, sanitizeCourse) : MY_COURSES,
    campuses: Array.isArray(s.campuses) ? sanitizeList(s.campuses, sanitizeCampus) : CAMPUSES,
    buildings: isObject(s.buildings) ? sanitizeBuildingsMap(s.buildings) : CAMPUS_BUILDINGS,
  };
}
