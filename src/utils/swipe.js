const MIN_DISTANCE = 60; // これ以上横に動いたらスワイプとみなす（px）
const HORIZONTAL_RATIO = 1.5; // 縦の動きよりこの倍率以上、横に大きいとき

// 指の移動量からスワイプの向きを返す。左へ: 1（次へ）/ 右へ: -1（前へ）/ スワイプでなければ 0
export const getSwipeDirection = (dx, dy) => {
  if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return 0;
  return dx < 0 ? 1 : -1;
};
