![GitHub Release](https://img.shields.io/github/v/release/ryiot443311/jugyo-KakuNIN)
![GitHub License](https://img.shields.io/github/license/ryiot443311/jugyo-KakuNIN)
![GitHub contributors](https://img.shields.io/github/contributors/ryiot443311/jugyo-KakuNIN)

![GitHub watchers](https://img.shields.io/github/watchers/ryiot443311/jugyo-KakuNIN)
![GitHub Repo stars](https://img.shields.io/github/stars/ryiot443311/jugyo-KakuNIN)

# 授業出欠管理アプリ (Attendance Tracker)

大学生向けのシンプルで高機能な授業・出欠管理アプリケーションです。
React + Viteで構築されており、クォーター（学期）制への対応や、ローカルストレージを用いた記録の保存機能を備えています。

> **特徴**: 電波の悪い場所でもすぐ開けてすぐ確認できます - インターネット接続不要で、ブラウザのみで動作します！

## 📋 主な機能

- **⚡ 時間割＆ワンタップ打刻**: 今日の授業だけが自動で表示され、「出席」「遅刻」「欠席」「休講」をワンタップで記録できます。
- **🗓️ 過去の日付にも記録**: 前週・次週の移動や日付の指定で、記録し忘れた日にもあとから記録できます（未来の日付は記録不可）。
- **✏️ 記録の修正・削除**: 間違えて付けた記録は、あとから状態の変更や削除ができます。
- **📝 授業ごとのメモ機能**: 持ち物や課題の期限などを授業ごとにメモ可能。メモがある場合はバッジでわかりやすく表示されます。
- **📅 自動クォーター判定**: 現在の日付から第1Q〜第4Qを自動で判定し、期間外の誤打刻を防ぎます。
- **🚀 動作の軽量化・高速化**: `useMemo` と `useCallback` を活用し、文字入力時やタブ切り替え時の無駄な再計算を抑え、スマホでもサクサク動きます。
- **🚫 本日の授業なし表示**: 授業がない日は「本日の授業なし」と表示され、見やすさが向上しています。
- **📂 履歴のアコーディオン表示**: 「月 ＞ 週 ＞ 日付」の階層でスッキリと履歴を振り返ることができます。
- **📊 出欠・遅刻機能**: 授業ごとの出席率や、全体の出席率を視覚的にグラフ化します。
- **🗺️ キャンパスマップ**: 迷いやすいキャンパス内の教室や施設情報を素早く確認できます。
- **💾 オフライン対応**: LocalStorageを使用してすべてのデータをローカルに保存。インターネット不要です。

## 🛠️ 技術スタック

| 技術 | 用途 |
|------|------|
| **React** | UIコンポーネント、状態管理 |
| **Vite** | 高速ビルドツール |
| **CSS** | スタイリング |
| **HTML** | マークアップ |
| **LocalStorage** | ブラウザ側のデータ永続化 |

## 🚀 導入手順

ローカル環境で動かすための手順です。

### リポジトリのクローン
```bash
git clone https://github.com/ryiot443311/jugyo-KakuNIN.git
```

### ディレクトリへ移動
```bash
cd jugyo-KakuNIN
```

### 依存関係のインストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

## ⚙️ 自分の時間割を登録する方法（カスタマイズ）
このアプリは、使う人それぞれの時間割に合わせて簡単にカスタマイズできます。
授業の登録や時間割の変更は、すべて src/data/constants.js を編集して行います。

### 1. 授業の追加 (MY_COURSES)
src/data/constants.js を開き、MY_COURSES の配列に自分の授業を追加してください。
```javascript
export const MY_COURSES = [
  { 
    id: "unique-id-1",       // 重複しない任意のID (例: "mon-1")
    name: "プログラミング基礎", // 授業名
    quarter: 1,              // クォーター (1, 2, 3, 4) 
                             // ※通年や前学期通しの場合は [1, 2] のように配列にします
    dayOfWeek: 1,            // 曜日 (1:月, 2:火, 3:水, 4:木, 5:金, 6:土, 0:日)
    period: 1,               // 時限 (1限目なら 1)
    campus: "north",     // キャンパスID (CAMPUSES の id)
    room: "3-601",          // 教室番号
    teacher: "山田 太郎"        // 担当教員
  },
  // ... 自分の授業をどんどん追加！
];
```

### 2. 時限の時間設定 (PERIODS)
大学のチャイムに合わせて授業時間を変更できます。
```javascript
export const PERIODS = {
  1: { start: '09:00', end: '10:30' },
  2: { start: '10:40', end: '12:10' },
  3: { start: '13:00', end: '14:30' },
  4: { start: '14:40', end: '16:10' },
  // ... 大学のシラバスに合わせて変更してください
};
```
### 3. マップと施設情報 (CAMPUSES / CAMPUS_BUILDINGS)
所属する大学のキャンパス情報に変更できます。
```javascript
export const CAMPUSES = [
  { id: "north", name: "北キャンパス", mapImage: "/north_campus_map.jpg" }, // 画像がなければ null
  // ... 複数のキャンパスに対応
];

export const CAMPUS_BUILDINGS = {
  north: [ // キーは CAMPUSES の id
    { id: "n-3", name: "3号館", description: "講義室・PC教室" },
    // ... 建物情報を追加
  ],
};
```
📌 マップ画像を使用する場合: public/ ディレクトリにマップ画像（.jpg や .png）を配置し、CAMPUSES の mapImage にパスを指定してください。画像がない場合は「マップ画像がありません」と表示されます。


## 📦 ビルド・デプロイ
### 本番用ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

### コード品質チェック
```bash
npm run lint
```
push・プルリクエストのたびに、GitHub Actions で lint とビルドが自動で実行されます。

## 🎯 使用シーン
- 講義中: 出席・遅刻・欠席・休講をワンタップで記録
- 講義前: 今日のスケジュール確認、教室位置確認、持ち物や課題のメモ確認
- 学期末: 授業ごとの出席率を分析、欠席パターン確認
- キャンパス内: 教室や施設の位置をすぐ確認

## 📝 プロジェクト構成
```text
jugyo-KakuNIN/
├── .github/workflows/ci.yml   # CI（lint・ビルド）
├── src/
│   ├── data/
│   │   ├── constants.js       # 時間割・授業情報の設定ファイル
│   │   └── status.js          # 出欠の種類・色
│   ├── components/            # モーダルなどの共通部品
│   ├── views/                 # 各タブの画面（日別・週間・履歴・分析・マップ）
│   ├── hooks/                 # localStorage 保存・今日の日付
│   ├── utils/date.js          # 日付・クォーター計算
│   ├── App.jsx                # メインアプリケーション
│   ├── App.css                # スタイル
│   └── main.jsx               # エントリーポイント
├── public/                    # 静的ファイル（マップ画像など）
├── index.html                 # HTMLテンプレート
├── package.json               # 依存関係管理
├── vite.config.js             # Viteの設定
└── README.md                  # このファイル
```
## ⚖️ ライセンス
This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Tips
- 一度設定すれば、あとはアプリを開いて出席状況を記録するだけ
- すべてのデータはブラウザに保存されるため、バックアップを取りたい場合はブラウザの開発者ツールで LocalStorage をエクスポート可能
- オフラインで完全に動作するため、どんな環境でもすぐに確認できます
- スマホからの起動時は、Termuxウィジェットから node ./node_modules/vite/bin/vite.js で直接Viteを起動することで高速化が可能です

作成者: ryiot443311  
最終更新: 2026-10-20
