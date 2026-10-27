import * as sample from './constants.sample';

// constants.local.js があれば、そこに書いた項目を優先する（実データ用。.gitignore 済みでコミットされない）
// 無い場合や、書いていない項目は constants.sample.js のサンプルを使う
const local = Object.values(import.meta.glob('./constants.local.js', { eager: true }))[0] ?? {};

export const MY_COURSES = local.MY_COURSES ?? sample.MY_COURSES;
export const PERIODS = local.PERIODS ?? sample.PERIODS;
export const QUARTERS = local.QUARTERS ?? sample.QUARTERS;
export const CAMPUSES = local.CAMPUSES ?? sample.CAMPUSES;
export const CAMPUS_BUILDINGS = local.CAMPUS_BUILDINGS ?? sample.CAMPUS_BUILDINGS;
