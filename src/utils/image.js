// 画像ファイルを縮小した JPEG の data URL にする（保存容量を節約するため）
import { ja } from '../i18n/messages';

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 極端に大きなファイルは読み込まない

export async function fileToDataUrl(file, t = ja, maxSize = 1600, quality = 0.8) {
  if (!file.type.startsWith('image/')) throw new Error(t.notImage);
  if (file.size > MAX_FILE_BYTES) throw new Error(t.imageTooLarge);
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error(t.imageLoadFailed); });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // 透過 PNG の背景を白にする
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
