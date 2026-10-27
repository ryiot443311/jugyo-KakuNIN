export const hasText = (text) => !!text && text.trim() !== '';

// 日付ごとのメモ（その日だけの教室変更など）のキー。以前のバージョンと同じ「授業ID|日付」
export const dateMemoKey = (courseId, date) => `${courseId}|${date}`;
