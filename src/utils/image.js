// 画像ファイルを縮小した JPEG の data URL にする（localStorage の容量を節約するため）
export async function fileToDataUrl(file, maxSize = 1600, quality = 0.8) {
  if (!file.type.startsWith('image/')) throw new Error('画像ファイルを選んでください');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('画像を読み込めませんでした'); });
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
