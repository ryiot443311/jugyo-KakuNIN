// 時間割・キャンパス情報のサンプルデータ（公開リポジトリ用の架空の内容）
// 自分の実データは、このファイルを src/data/constants.local.js にコピーして書き換えてください。
// constants.local.js は .gitignore 済みのため、コミット・公開されません。

// 授業一覧
// quarter: 1〜4 の数値、または複数クォーターにまたがる場合は [1, 2] のような配列
// dayOfWeek: 0:日, 1:月, 2:火, 3:水, 4:木, 5:金, 6:土
export const MY_COURSES = [
  { id: 'mon-1', name: 'プログラミング基礎', quarter: 1, dayOfWeek: 1, period: 1, campus: 'north', room: '3-601', teacher: '山田 太郎' },
  { id: 'tue-2', name: '線形代数', quarter: [1, 2], dayOfWeek: 2, period: 2, campus: 'north', room: '2-301', teacher: '佐藤 花子' },
  { id: 'wed-3', name: '英語コミュニケーション', quarter: [3, 4], dayOfWeek: 3, period: 3, campus: 'south', room: 'A-201', teacher: 'John Smith' },
  { id: 'thu-1', name: 'データ構造とアルゴリズム', quarter: 3, dayOfWeek: 4, period: 1, campus: 'north', room: '3-502', teacher: '鈴木 一郎' },
  { id: 'fri-4', name: '情報倫理', quarter: 4, dayOfWeek: 5, period: 4, campus: 'north', room: '1-101', teacher: '高橋 次郎' },
  { id: 'sat-2', name: '体育実技', quarter: [3, 4], dayOfWeek: 6, period: 2, campus: 'south', room: '体育館', teacher: '田中 三郎' },
];

// 時限ごとの時間（大学の時間割に合わせて書き換えてください）
export const PERIODS = {
  1: { start: '09:00', end: '10:30' },
  2: { start: '10:40', end: '12:10' },
  3: { start: '13:00', end: '14:30' },
  4: { start: '14:40', end: '16:10' },
  5: { start: '16:20', end: '17:50' },
};

// クォーターの期間（'MM-DD'、大学の学年暦に合わせて書き換えてください）
// 年をまたぐ期間は start を end より後の日付にします（例: 第4Q の 11-01〜01-31）
export const QUARTERS = {
  1: { start: '04-01', end: '05-31' },
  2: { start: '06-01', end: '07-31' },
  3: { start: '09-01', end: '10-31' },
  4: { start: '11-01', end: '01-31' },
};

// キャンパス一覧（マップ画面の切り替えボタン）
// mapImage: public/ に置いた画像のパス。画像がない場合は null にしてください
export const CAMPUSES = [
  { id: 'north', name: '北キャンパス', mapImage: '/north_campus_map.jpg' },
  { id: 'south', name: '南キャンパス', mapImage: '/south_campus_map.jpg' },
];

// キャンパスごとの建物・施設情報（キーは CAMPUSES の id）
export const CAMPUS_BUILDINGS = {
  north: [
    { id: 'n-1', name: '1号館', description: '1階: 学生課 / 2〜5階: 講義室' },
    { id: 'n-2', name: '2号館', description: '講義室・演習室' },
    { id: 'n-3', name: '3号館', description: '講義室・PC教室 / 地下: 食堂' },
  ],
  south: [
    { id: 's-a', name: 'A館', description: '講義室' },
    { id: 's-gym', name: '体育館', description: '体育実技・部活動' },
  ],
};
