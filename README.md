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
