# ai-anime-production-dashboard

ティア・ノヴァのAIアニメ制作管理アプリです。

## Version 0.1

React + TypeScript + Vite の標準構成を土台にした試作版です。GitHub Pages への公開を前提に、Vite の `base` を `/ai-anime-production-dashboard/` に設定しています。

### 起動方法

```bash
npm install
npm run dev
```

表示されたローカルURLをブラウザで開いてください。

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` に出力されます。

### GitHub Pages

`main` ブランチへの push、または GitHub Actions の手動実行で `.github/workflows/deploy.yml` が起動し、`npm install`、`npm run build`、Pages へのデプロイを実行します。

### 動作確認方法

1. ホーム画面で作品名を編集できることを確認します。
2. 「第0話を開く」ボタンで第0話の先頭場面を選択できることを確認します。
3. 場面一覧にダミー5場面、制作状態、Vidu難易度が表示されることを確認します。
4. 場面を選択し、場面詳細の各項目を編集できることを確認します。
5. ブラウザを再読み込みして、編集内容が localStorage から復元されることを確認します。
6. 「JSON書き出し」でJSONファイルを保存できることを確認します。
7. 「JSON読み込み」で書き出したJSONを読み込めることを確認します。

## Version 0.3

Dream Architect Studio として、1作品・第0話のみの管理から、次の4階層で制作情報を管理できる構造へ拡張しました。

```text
作品一覧 → 話数一覧 → 場面一覧 → 場面編集
```

### 主な変更

- 作品ごとに複数話を管理できます。
- 話数ごとに複数場面を管理できます。
- 作品、話数、場面にサムネイル画像参照、タグ、お気に入り、制作メモを保存できます。
- 画像本体は localStorage へ保存せず、ファイル名・URL・参照情報のみを保存します。
- Version 0.2 の `ai-anime-production-dashboard:v0.1` は削除せず、初回起動時に `dream-architect-studio:v0.3` へ自動移行します。
- 移行前データは `dream-architect-studio:migration-backup:v0.2` へバックアップします。
- 完全バックアップJSONとChatGPT共有JSONを、全体・作品・話数・場面単位で書き出せます。

### GitHub Pages確認

1. `npm run build` を実行してビルドが成功することを確認します。
2. `npm run preview` を実行します。
3. 表示されたURLを開き、作品一覧が表示されることを確認します。
4. 作品を開き、話数一覧、場面一覧、場面編集へ順に移動できることを確認します。
5. JSON連携から、範囲を選んで書き出しできることを確認します。

Vite の `base` は相対パスの `./` で設定しているため、GitHub Pages のリポジトリ配下でも表示しやすい構成です。

## Version 0.4

Dream Architect Studio の場面編集画面に「素材管理システム」の土台を追加しました。

- 各場面に `assets` 配列を追加し、Version 0.3 JSON は既存情報を保持したまま空の素材一覧付きで自動移行します。
- 素材種別は image / video / audio / prompt / document / url / other に対応します。
- 場面編集画面の下部で素材カードを追加・編集・削除できます。
- 素材カードではタイトル、種類、画像・動画用サムネイル、採用／未採用、更新日時を確認できます。
- 編集項目はタイトル、種類、URLまたはファイル参照名、サムネイルURL、説明、メモ、タグ、採用、お気に入り、更新日時です。
- 保存キーと書き出しファイル名を Version 0.4 に更新しました。
