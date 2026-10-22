# AI機能（Claude API）のデプロイ手順

AI機能（チャット・テキスト/写真/URLからのレシピ抽出）は、ブラウザから直接AIを呼ぶのではなく、
Cloud Functions（`functions/`）を経由して Claude API を呼ぶ構成になっている。

```
ブラウザ(PWA) --Firebase Auth IDトークン--> Cloud Functions `recipeAi` --API key(Secret Manager)--> Claude API
```

## なぜこの構成か

- `EXPO_PUBLIC_*` の環境変数はビルド時にJSへ直書きされ、公開サイトから誰でも読めてしまう。
  以前はGeminiのAPIキーがこの経路で公開されていた。
- Functions 側で「許可メール（`ALLOWED_EMAIL`）かつメール確認済み」のユーザーだけ通すので、
  本人以外はAIを呼べない。
- 1日あたりの回数上限（`AI_DAILY_LIMIT`、既定200）を Firestore の `aiUsage` コレクションで数え、
  アカウント乗っ取り時の被害を抑える。
- Claude API の支払いは Max プランの月次APIクレジット（$100）。Console に支払い方法を登録しない限り、
  クレジットを使い切ってもリクエストが止まるだけで追加請求は発生しない。

## 初回セットアップ（1回だけ）

### 1. Claude API キーを用意する

1. claude.ai の **設定 → 請求** で「APIクレジット」に Console 組織をリンクする（Max プラン加入後7日以降）。
2. https://platform.claude.com/settings/billing でプロモーションクレジットが入っていることを確認。
   **支払い方法は登録しない。自動リロードも入れない。**
3. 同ページの Spend limits で自分の上限（例: $50）を設定する。
4. https://platform.claude.com/settings/keys で API キーを作成する（Workspace を `hapicook` として分けると、
   Workspace 単位の上限も付けられる）。

### 2. API キーを Secret Manager に登録する

キーはこのリポジトリにも `.env` にも書かない。次のコマンドで対話的に貼り付ける。

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```

初回は Secret Manager API の有効化を求められることがあるので、表示に従って `y` を押す。

### 3. Functions の設定値を確認する

`functions/.env`（コミット対象。秘密情報は含めない）:

```
ALLOWED_EMAIL=jetblack13k13@gmail.com
AI_DAILY_LIMIT=200
```

## デプロイ

```bash
firebase deploy --only functions
```

（`firebase.json` の predeploy で `functions/` の TypeScript ビルドが自動で走る）

続けて Web を再ビルドして Hosting へ反映する。

```bash
npx expo export -p web
```

```bash
firebase deploy --only hosting
```

## 動作確認

1. https://hapicook-14d13.web.app を開き、Google でログインする。
2. 「AIと相談してレシピ作成」で何か送って返答が返ること。
3. 許可外のGoogleアカウントでログインするとAI機能が「個人利用モードです」で拒否されること。
4. 使用量は https://platform.claude.com/cost で確認できる。

## キーを漏らしたと思ったら

1. https://platform.claude.com/settings/keys でそのキーを削除する。
2. 新しいキーを作って `firebase functions:secrets:set ANTHROPIC_API_KEY` で差し替え、
   `firebase deploy --only functions` で再デプロイする。

## 開発メモ

- 関数本体: `functions/src/index.ts`（認証・入力検証・回数制限）、`functions/src/claude.ts`（Claude 呼び出し）
- アプリ側の呼び出し: `services/aiService.ts`（`httpsCallable` で `recipeAi` を呼ぶ）
- リージョンは `asia-northeast1`。変更する場合は `functions/src/index.ts` と `services/aiService.ts` の両方を直す。
- モデルは `claude-opus-5-5`。レシピ抽出は構造化出力（zod スキーマ）で JSON を強制している。
- ローカルで Functions を動かす場合は Java が必要な Firestore エミュレータも使うため、
  このPCでは未検証。型チェックは `cd functions && npm run build`。
