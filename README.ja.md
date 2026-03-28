# MemoBox

[English README](./README.md)

MemoBox は、日付ベースのメモ運用を VS Code 上で行うための拡張機能です。
保守しやすい構造、日常的に使いやすいメモ操作、必要な場合だけ有効化できる AI 機能を重視しています。

## 現在のリリース

- 現在のリリース: `0.1.0`
- 位置づけ: 初回公開リリース

MemoBox `0.1.0` は、日々のメモ作成・検索・参照・管理を一通り行える状態を目標にしています。

## スクリーンショット

管理画面:

![MemoBox admin dashboard](./docs/screenshots/admin-overview.png)

初回セットアップ:

![MemoBox setup flow](./docs/screenshots/setup-flow.png)

基本ワークフロー:

![MemoBox memo workflow demo](./docs/screenshots/memo-workflow.gif)

クイックメモ:

![MemoBox quick memo demo](./docs/screenshots/quick-memo.gif)

Grep:

![MemoBox grep workflow demo](./docs/screenshots/grep-workflow.gif)

セットアップ:

![MemoBox setup workflow demo](./docs/screenshots/setup-workflow.gif)

AI タイトル補助:

![MemoBox AI title workflow demo](./docs/screenshots/ai-title-workflow.gif)

## 主な機能

- 日付付きメモの作成とテンプレート選択
- 今日のメモへのクイック追記
- 一覧、タグ閲覧、Grep、Todo 抽出、関連メモ表示
- 相対メモリンク挿入と Markdown リンク補完
- Backlinks 表示と `[[memo]]` の作成または解決
- Markdown 用の Slash コマンド、表整形、脚注補助
- 管理画面、セットアップ画面、ワークスペース生成、カスタムページ
- バックアップ付き永続インデックスと増分更新
- scaffold からのテンプレート・スニペット初期配置
- 日本語 / 英語の UI
- MemoBox / AI のログ出力
- 任意で有効化できる AI 支援

## 主なコマンド

日常利用:

- `MemoBox: 新規メモ`
- `MemoBox: 今日のクイックメモ`
- `MemoBox: 一覧 / 編集`
- `MemoBox: タグから開く`
- `MemoBox: メモリンクを挿入`
- `MemoBox: Show Backlinks`
- `MemoBox: Open or Create [[memo]]`
- `MemoBox: Grep`
- `MemoBox: Todo`
- `MemoBox: 関連メモ`
- `MemoBox: Re:Date`
- `MemoBox: Markdown をブラウザで開く`
- `MemoBox: Format Markdown Table`
- `MemoBox: Insert Footnote`

管理・セットアップ:

- `MemoBox Admin: 管理画面を開く`
- `MemoBox Admin: Setup を開く`
- `MemoBox Admin: 設定を開く`
- `MemoBox Admin: ワークスペースを作成`
- `MemoBox Admin: メモフォルダを開く`
- `MemoBox Admin: インデックスを更新`
- `MemoBox Admin: インデックスを再構築`
- `MemoBox Admin: インデックスキャッシュを削除`
- `MemoBox Admin: ログを開く`
- `MemoBox Admin: AI ログを開く`
- `MemoBox: Open Custom Page`

AI コマンドは `memobox.aiEnabled` が有効な場合のみ表示されます。

## 日常ワークフロー

`MemoBox: 新規メモ` は `memobox.memodir` 配下に、`memobox.datePathFormat` に従った日付付きメモを作成します。テンプレート選択、選択文字列やクリップボードからのタイトル補助にも対応しています。

`MemoBox: 今日のクイックメモ` は今日のメモへ時刻付きブロックを追記します。まだ当日のメモがない場合は、既定テンプレートを使って最初のファイルを作成します。

`MemoBox: メモリンクを挿入` は別メモへの相対 Markdown リンクを挿入します。`[[...` や `[Label](` 入力中の補完にも対応しています。

`MemoBox: Show Backlinks` は現在のメモを参照しているメモを一覧表示します。`MemoBox: Open or Create [[memo]]` はカーソル位置の wiki 形式リンクを解決し、見つからなければ新規メモを作成します。

MemoBox には Markdown 補助もあります。

- `/` 入力から使える Slash コマンド
- `MemoBox: Format Markdown Table`
- `MemoBox: Insert Footnote`

## コマンドランチャー

`MemoBox: Commands` は、Daily / Context / Maintenance / AI ごとに整理された QuickPick ランチャーです。グローバルなコマンドパレットより、MemoBox の操作だけを絞って使いたい時に向いています。

## テンプレートとスニペット

MemoBox は [`resources/scaffold`](/C:/Users/mail/Documents/git/vscode-memobox/resources/scaffold) から初期テンプレートとスニペットを配置します。

既定 scaffold:

- `simple.md`
- `meeting.md`
- `memo.json`

テンプレートは YAML frontmatter を前提としており、主に次の項目を使います。

- `title`
- `tags`
- `date`

`simple.md` には初期タグとして `inbox` が入っています。テンプレートとスニペットの配置先は、既定のメタディレクトリ配下または設定した絶対パスのどちらにもできます。

## インデックス

MemoBox はメモファイル用の永続インデックスを持ちます。保存内容はパス、時刻、サイズ、frontmatter の `title` と `tags` で、本文そのものはキャッシュしません。

現在の挙動:

- 初回ロード時は `primary -> backup -> transient backup` の順で読み込み
- 通常の編集では save / create / delete / rename イベントに応じた増分更新
- フル再帰走査は初回、明示更新、未知変更、定期検証時に限定
- 読めないファイルは全体失敗にせずスキップ
- 安全書き込みは temp + backup を使う

このインデックスは次の機能で使われます。

- `一覧 / 編集`
- `タグから開く`
- `関連メモ`
- `Grep`
- `Todo`
- メモリンク挿入と補完
- Admin の統計表示

## Admin / Setup / Custom Pages

MemoBox には 2 つの組み込み Webview と、ユーザー作成のカスタムページがあります。

- `Setup`
  - 初回設定と修復フロー用
  - `memobox.memodir` をまずグローバル設定に保存
  - 必要に応じて `.code-workspace` を生成
- `Admin`
  - Recent / Pinned / Tags / Templates / Snippets / AI 状態 / Logs / Index 状態を確認するための運用画面
- `Custom Pages`
  - `.vscode-memobox/pages/` に配置した HTML を個別 Webview で表示
  - `{{VERSION}}` や `{{MEMO_ROOT}}`、`{{#each RECENT_FILES}}...{{/each}}` などのテンプレート変数に対応
  - `MemoBox: Open Custom Page` から開けます

Admin では `memobox.adminOpenOnStartup` の切り替えもできます。

## AI

AI は明示的な opt-in です。

- `memobox.aiEnabled`
  - 既定値: `false`
- `memobox.ai`
  - provider / profile / timeout / network などをまとめた JSON 設定

AI を無効にしている間:

- AI コマンドはコマンドパレットに表示されません
- Markdown エディタの右クリックメニューにも表示されません

API キーの解決順:

1. VS Code SecretStorage
2. `apiKeyEnv`
3. settings JSON の `apiKey`（互換用）

OpenAI 系 profile では、平文設定より SecretStorage や環境変数の利用を推奨しています。

SecretStorage に API キーを保存する手順:

1. `memobox.aiEnabled` を有効にする
2. `memobox.ai` で利用する profile を設定する
3. コマンドパレットで `MemoBox: AI Set API Key` を実行する
4. 対象 profile を選ぶ
5. API キーを入力して保存する

削除したい場合は `MemoBox: AI Clear Stored API Key` を実行します。

## ログ

MemoBox は次の 2 つの OutputChannel にログを書きます。

- `MemoBox`
- `MemoBox AI`

ログレベルは `memobox.logLevel` で変更できます。既定値は `warn` です。

- `off`
- `error`
- `warn`
- `info`

Admin から両方のログを開けます。

## 主な設定

- `memobox.memodir`
- `memobox.datePathFormat`
- `memobox.memotemplate`
- `memobox.metaDir`
- `memobox.templatesDir`
- `memobox.snippetsDir`
- `memobox.titlePrefix`
- `memobox.dateFormat`
- `memobox.memoNewFilenameFromClipboard`
- `memobox.memoNewFilenameFromSelection`
- `memobox.memoNewFilenameDateSuffix`
- `memobox.listSortOrder`
- `memobox.listDisplayExtname`
- `memobox.displayFileBirthTime`
- `memobox.openMarkdownPreview`
- `memobox.searchMaxResults`
- `memobox.excludeDirectories`
- `memobox.maxScanDepth`
- `memobox.grepViewMode`
- `memobox.todoPattern`
- `memobox.relatedMemoLimit`
- `memobox.recentCount`
- `memobox.adminOpenOnStartup`
- `memobox.locale`
- `memobox.logLevel`
- `memobox.aiEnabled`
- `memobox.ai`

## 開発

要件:

- Node.js `20.19.0`
- npm `10.x`

主なコマンド:

```bash
npm install
npm run build
npm run lint
npm run test
npm run validate
npm run test:e2e
npm run capture:readme-screenshots
npm run capture:readme-gif
```

VS Code 上で試す手順:

1. このリポジトリを VS Code で開く
2. `npm install` を実行する
3. `F5` で Extension Development Host を起動する
4. `MemoBox Admin: 管理画面を開く` を実行する

## パッケージングとテスト

- Unit test では index、grep/todo、tags、related memos、templates、snippets、logging、link completion などを検証しています
- Playwright E2E では Setup、Admin pin/unpin、新規メモ作成、Grep/Todo、設定表示、AI 表示などを確認しています
- VSIX では [`.vscodeignore`](/C:/Users/mail/Documents/git/vscode-memobox/.vscodeignore) により docs、tests、Playwright 資産、scripts、source maps などを除外しています

VSIX を生成するには:

```bash
npm run package:vsix
```

## リポジトリ構成

```text
src/
  core/         ドメインロジックと設定
  features/     VS Code コマンドと UI
  infra/        AI などの provider 固有実装
  shared/       共通ヘルパーと拡張メタデータ
test/           純粋ロジック用 unit test
docs/           補助ドキュメントと README 用素材
resources/      scaffold と webview テンプレート
```

## ライセンス

MIT

MemoBox は、[satokaz/vscode-memo-life-for-you](https://github.com/satokaz/vscode-memo-life-for-you) に影響を受けて開発しています。個人的に使いたい機能を詰め込んだ実験的な拡張機能です。
