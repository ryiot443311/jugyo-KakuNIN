// テキストをファイルとして保存する
export function downloadText(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// バックアップ JSON をファイルとして保存する
export const downloadBackup = (json) => downloadText(`jugyo-kakunin-backup-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json');
