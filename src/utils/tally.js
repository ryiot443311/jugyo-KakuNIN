// 正の字で回数を表す（5回ごとに「正」、端数は 一・丅・下・止）
const PARTS = ['', '一', '丅', '下', '止'];
export const toTally = (n) => (Number.isInteger(n) && n > 0 ? '正'.repeat(Math.floor(n / 5)) + PARTS[n % 5] : '');
