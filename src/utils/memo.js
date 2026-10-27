export const hasText = (text) => !!text && text.trim() !== '';

// 日付ごとのメモ（その日だけの教室変更など）のキー
export const dateMemoKey = (date, courseId) => `${date}|${courseId}`;
