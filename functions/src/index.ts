// HapiCook Cloud Functions
// AI 機能（Claude API）を本人限定で中継する callable。API キーはブラウザに一切出さない。
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineInt, defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

import { chat, extractFromImage, extractFromPageText, extractFromText, finalizeFromChat } from './claude.js';
import { fetchPageText } from './pageText.js';
import { consumeDailyQuota } from './rateLimit.js';
import { RequestSchema } from './schema.js';

initializeApp();

// --- 設定値 ---
// Secret Manager: `firebase functions:secrets:set ANTHROPIC_API_KEY`
const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');
// functions/.env: 個人利用モードで許可するメールアドレス（firestore.rules と同じ値）
const allowedEmail = defineString('ALLOWED_EMAIL');
// 1日あたりの AI 呼び出し上限（本人のみなので乗っ取り時の被害を抑える目的）
const dailyLimit = defineInt('AI_DAILY_LIMIT', { default: 200 });

export const recipeAi = onCall(
  {
    region: 'asia-northeast1',
    secrets: [anthropicApiKey],
    memory: '512MiB',
    timeoutSeconds: 120,
    // 本人 1 人しか使わないので同時実行を絞り、乗っ取り時の被害も抑える
    maxInstances: 2,
    cors: ['https://hapicook-14d13.web.app', 'https://hapicook-14d13.firebaseapp.com', /^http:\/\/localhost(:\d+)?$/],
  },
  async (request) => {
    // 1. 認証: Firebase Auth でログイン済み、かつ許可メール（確認済み）だけ通す
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'ログインが必要です。');
    }
    const email = auth.token.email;
    const verified = auth.token.email_verified === true;
    if (!email || !verified || email !== allowedEmail.value()) {
      logger.warn('recipeAi: 許可されていないユーザーからの呼び出し', { uid: auth.uid, email });
      throw new HttpsError('permission-denied', 'このアプリは個人利用モードです。許可されたアカウントでログインしてください。');
    }

    // 2. 入力検証
    const parsed = RequestSchema.safeParse(request.data);
    if (!parsed.success) {
      logger.warn('recipeAi: 入力が不正', { issues: parsed.error.issues.slice(0, 3) });
      throw new HttpsError('invalid-argument', 'リクエストの形式が正しくありません。');
    }
    const req = parsed.data;

    // 3. 回数制限
    const db = getFirestore();
    const ok = await consumeDailyQuota(db, auth.uid, dailyLimit.value());
    if (!ok) {
      throw new HttpsError('resource-exhausted', '本日のAI利用回数の上限に達しました。明日またお試しください。');
    }

    // 4. Claude 呼び出し
    const apiKey = anthropicApiKey.value();
    try {
      switch (req.action) {
        case 'chat':
          return { text: await chat(apiKey, req.history, req.message) };
        case 'finalize':
          return { recipe: await finalizeFromChat(apiKey, req.history) };
        case 'extractText':
          return { recipe: await extractFromText(apiKey, req.text) };
        case 'extractImage':
          return { recipe: await extractFromImage(apiKey, req.base64, req.mimeType) };
        case 'extractUrl': {
          const pageText = await fetchPageText(req.url);
          return { recipe: await extractFromPageText(apiKey, req.url, pageText) };
        }
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error('recipeAi: 処理に失敗', { action: req.action, message });
      // ユーザー向けに作った日本語メッセージはそのまま返し、それ以外は汎用メッセージに丸める
      const userFacing = /[぀-ヿ一-龯]/.test(message)
        ? message
        : 'AIとの通信に失敗しました。しばらくしてから再度お試しください。';
      throw new HttpsError('internal', userFacing);
    }
  }
);
