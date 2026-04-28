![GitHub contributors](https://img.shields.io/github/contributors/ryiot443311/jugyo-KakuNIN)
![GitHub watchers](https://img.shields.io/github/watchers/ryiot443311/jugyo-KakuNIN)
![GitHub Repo stars](https://img.shields.io/github/stars/ryiot443311/jugyo-KakuNIN)




# 授業出欠管理アプリ (Attendance Tracker)

大学生向けのシンプルで高機能な授業・出欠管理アプリケーションです。
React + Viteで構築されており、クォーター（学期）制への対応や、ローカルストレージを用いた記録の保存機能を備えています。

> **特徴**: 電波の悪い場所でもすぐ開けてすぐ確認できます - インターネット接続不要で、ブラウザのみで動作します！

## 📋 主な機能

- **⚡ 時間割＆ワンタップ打刻**: 今日の授業だけが自動で表示され、「出席」「遅刻」「欠席」をワンタップで記録できます。
- **📅 自動クォーター判定**: 現在の日付から第1Q〜第4Qを自動で判定し、期間外の誤打刻を防ぎます。
- **📂 履歴のアコーディオン表示**: 「月 ＞ 週 ＞ 日付」の階層でスッキリと履歴を振り返ることができます。
- **📊 出欠・遅刻機能**: 授業ごとの出席率や、全体の出席率を視覚的にグラフ化します。
- **🗺️ キャンパスマップ**: 迷いやすいキャンパス内の教室や施設情報を素早く確認できます。
- **💾 オフライン対応**: LocalStorageを使用してすべてのデータをローカルに保存。インターネット不要です。

## 🛠️ 技術スタック

| 技術 | 用途 |
|------|------|
| **React** (96.7%) | UIコンポーネント、状態管理 |
| **Vite** | 高速ビルドツール |
| **CSS** (1.8%) | スタイリング |
| **HTML** (1.5%) | マークアップ |
| **LocalStorage** | ブラウザ側のデータ永続化 |

## 🚀 導入手順

ローカル環境で動かすための手順です。

```bash
# リポジトリのクローン
git clone https://github.com/ryiot443311/jugyo-KakuNIN.git

# ディレクトリへ移動
cd jugyo-KakuNIN

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## ⚙️ 自分の時間割を登録する方法（カスタマイズ）

このアプリは、使う人それぞれの時間割に合わせて簡単にカスタマイズできます。
授業の登録や時間割の変更は、すべて `src/data/constants.js` を編集して行います。

### 1. 授業の追加 (MY_COURSES)

`src/data/constants.js` を開き、`MY_COURSES` の配列に自分の授業を追加してください。

```javascript
export const MY_COURSES = [
  { 
    id: "unique-id-1",       // 重複しない任意のID (例: "mon-1")
    name: "プログラミング基礎", // 授業名
    quarter: 1,              // クォーター (1, 2, 3, 4) 
                             // ※通年や前学期通しの場合は [1, 2] のように配列にします
    dayOfWeek: 1,            // 曜日 (1:月, 2:火, 3:水, 4:木, 5:金, 6:土, 0:日)
    period: 1,               // 時限 (1限目なら 1)
    campus: "津田沼",          // キャンパス名
    room: "37-601",          // 教室番号
    teacher: "山田 太郎"        // 担当教員
  },
  // ... 自分の授業をどんどん追加！
];
```

### 2. 時限の時間設定 (PERIODS)

大学のチャイムに合わせて授業時間を変更できます。

```javascript
export const PERIODS = {
  1: { start: '09:00', end: '10:40' },
  2: { start: '10:55', end: '12:35' },
  3: { start: '13:35', end: '15:15' },
  4: { start: '15:30', end: '17:10' },
  // ... 大学のシラバスに合わせて変更してください
};
```

### 3. マップと施設情報 (CAMPUS_BUILDINGS)

所属する大学のキャンパス情報に変更できます。

```javascript
export const CAMPUS_BUILDINGS = {
  "津田沼": [
    { name: "37号館", number: "37", floor: "6階", facilities: "教室" },
    // ... キャンパス情報を追加
  ],
  // ... 複数のキャンパスに対応
};
```

> 📌 **マップ画像を使用する場合**: `public/` ディレクトリにお手持ちのマップ画像（`.jpg` や `.png`）を配置し、`src/App.jsx` 内の `<img src="...">` のパスを変更してください。

## 📦 ビルド・デプロイ

```bash
# 本番用ビルド
npm run build

# プレビュー
npm run preview

# コード品質チェック
npm run lint
```

## 🎯 使用シーン

- **講義中**: 出席・遅刻・欠席をワンタップで記録
- **講義前**: 今日のスケジュール確認、教室位置確認
- **学期末**: 授業ごとの出席率を分析、欠席パターン確認
- **キャンパス内**: 教室や施設の位置をすぐ確認

## 📝 プロジェクト構成

```
jugyo-KakuNIN/
├── src/
│   ├── data/
│   │   └── constants.js       # 時間割・授業情報の設定ファイル
│   ├── App.jsx                # メインアプリケーション
│   └── main.jsx               # エントリーポイント
├── public/                    # 静的ファイル（マップ画像など）
├── index.html                 # HTMLテンプレート
├── package.json               # 依存関係管理
├── vite.config.js             # Viteの設定
└── README.md                  # このファイル
```

## ⚖️ ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💡 Tips

- 一度設定すれば、あとはアプリを開いて出席状況を記録するだけ
- すべてのデータはブラウザに保存されるため、バックアップを取りたい場合はブラウザの開発者ツールで LocalStorage をエクスポート可能
- オフラインで完全に動作するため、どんな環境でもすぐに確認できます

---

**作成者**: ryiot443311  
**最終更新**: 2026-04-29
