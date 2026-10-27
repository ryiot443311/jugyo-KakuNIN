export const STREAK_ALERT = 2; // この回数以上、連続で欠席していたら注意を出す

// beforeDate より前の記録で、末尾から数えた連続欠席の回数（休講は数えず、飛ばす。出席・遅刻で途切れる）
export const getAbsenceStreak = (logs, courseId, beforeDate) => {
  const own = logs
    .filter(l => l.courseId === courseId && l.date < beforeDate && l.status !== '休講')
    .sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0;
  for (let i = own.length - 1; i >= 0 && own[i].status === '欠席'; i--) streak++;
  return streak;
};
