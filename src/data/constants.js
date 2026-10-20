// 時間割・キャンパス情報の設定ファイル
// 以下はサンプルデータです。自分の時間割に合わせて書き換えてください。

// 授業一覧
// quarter: 1〜4 の数値、または複数クォーターにまたがる場合は [1, 2] のような配列
// dayOfWeek: 0:日, 1:月, 2:火, 3:水, 4:木, 5:金, 6:土
export const MY_COURSES = [
  { id: 'mon-1', name: 'プログラミング基礎', quarter: 1, dayOfWeek: 1, period: 1, campus: 'tsudanuma', room: '3-601', teacher: '山田 太郎' },
  { id: 'tue-2', name: '線形代数', quarter: [1, 2], dayOfWeek: 2, period: 2, campus: 'tsudanuma', room: '2-301', teacher: '佐藤 花子' },
  { id: 'wed-3', name: '英語コミュニケーション', quarter: [3, 4], dayOfWeek: 3, period: 3, campus: 'mimomi', room: 'A-201', teacher: 'John Smith' },
  { id: 'thu-1', name: 'データ構造とアルゴリズム', quarter: 3, dayOfWeek: 4, period: 1, campus: 'tsudanuma', room: '3-502', teacher: '鈴木 一郎' },
  { id: 'fri-4', name: '情報倫理', quarter: 4, dayOfWeek: 5, period: 4, campus: 'tsudanuma', room: '1-101', teacher: '高橋 次郎' },
  { id: 'sat-2', name: '体育実技', quarter: [3, 4], dayOfWeek: 6, period: 2, campus: 'mimomi', room: '体育館', teacher: '田中 三郎' },
];

// 時限ごとの時間
export const PERIODS = {
  1: { start: '09:00', end: '10:40' },
  2: { start: '10:55', end: '12:35' },
  3: { start: '13:35', end: '15:15' },
  4: { start: '15:30', end: '17:10' },
  5: { start: '17:25', end: '19:05' },
};

// キャンパス一覧（マップ画面の切り替えボタン）
// mapImage: public/ に置いた画像のパス。画像がない場合は null にしてください
export const CAMPUSES = [
  { id: 'tsudanuma', name: '津田沼キャンパス', mapImage: '/tsudanuma_campus-map_img_02_sp.jpg' },
  { id: 'mimomi', name: '実籾キャンパス', mapImage: '/mimomi_campus-map_img_02_sp.jpg' },
];

// キャンパスごとの建物・施設情報（キーは CAMPUSES の id）
export const CAMPUS_BUILDINGS = {
  tsudanuma: [
    { id: 'tsu-1', name: '1号館', description: '1階: 学生課 / 2〜5階: 講義室' },
    { id: 'tsu-2', name: '2号館', description: '講義室・演習室' },
    { id: 'tsu-3', name: '3号館', description: '講義室・PC教室 / 地下: 食堂' },
  ],
  mimomi: [
    { id: 'mim-a', name: 'A館', description: '講義室' },
    { id: 'mim-gym', name: '体育館', description: '体育実技・部活動' },
  ],
};
