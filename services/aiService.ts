// services/aiService.ts
// AI 機能（Claude API）は Cloud Functions 経由で呼ぶ。API キーはアプリ側に持たない。
import { FunctionsError, getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';
import { Recipe } from '../types/recipe';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

type AiRequest =
  | { action: 'chat'; history: ChatMessage[]; message: string }
  | { action: 'finalize'; history: ChatMessage[] }
  | { action: 'extractText'; text: string }
  | { action: 'extractImage'; base64: string; mimeType: ImageMimeType }
  | { action: 'extractUrl'; url: string };

type AiResponse = { text?: string; recipe?: Partial<Recipe> };

// Functions は東京リージョンにデプロイしている（functions/src/index.ts の region と一致させる）
const functions = getFunctions(app, 'asia-northeast1');
const recipeAi = httpsCallable<AiRequest, AiResponse>(functions, 'recipeAi', { timeout: 120_000 });

/** Functions のエラーコードをユーザー向け日本語に変換する */
function toUserError(error: unknown, fallback: string): Error {
  if (error instanceof FunctionsError) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return new Error('ログインが必要です。');
      case 'functions/permission-denied':
        return new Error('このアプリは個人利用モードです。許可されたアカウントでログインしてください。');
      case 'functions/resource-exhausted':
        return new Error('本日のAI利用回数の上限に達しました。明日またお試しください。');
      case 'functions/invalid-argument':
        return new Error('送信内容が大きすぎるか、形式が正しくありません。');
      case 'functions/deadline-exceeded':
        return new Error('AIの応答がタイムアウトしました。もう一度お試しください。');
      default:
        // internal など: サーバー側で作った日本語メッセージがあればそれを使う
        return new Error(error.message && /[぀-ヿ一-龯]/.test(error.message) ? error.message : fallback);
    }
  }
  return new Error(fallback);
}

async function call(req: AiRequest, fallback: string): Promise<AiResponse> {
  try {
    const result = await recipeAi(req);
    return result.data;
  } catch (error) {
    console.error('recipeAi error:', error);
    throw toUserError(error, fallback);
  }
}

function normalizeMime(mimeType: string): ImageMimeType {
  const m = mimeType.toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  if (m === 'image/jpeg' || m === 'image/png' || m === 'image/gif' || m === 'image/webp') return m;
  // 不明な場合は jpeg として扱う（expo-image-picker の既定出力）
  return 'image/jpeg';
}

/**
 * AIチャット: 会話履歴を引き継いでメッセージを送り、AIの返答を得る
 */
export async function sendRecipeChatMessage(history: ChatMessage[], message: string): Promise<string> {
  const res = await call({ action: 'chat', history, message }, 'AIとの通信に失敗しました。しばらくしてから再度お試しください。');
  if (!res.text) throw new Error('AIから空の応答が返りました。もう一度お試しください。');
  return res.text;
}

/**
 * AIチャット: これまでの会話内容からレシピJSONを生成する
 */
export async function finalizeRecipeFromChat(history: ChatMessage[]): Promise<Partial<Recipe>> {
  const res = await call(
    { action: 'finalize', history },
    'レシピのまとめに失敗しました。もう少し会話でレシピの内容を固めてから再度お試しください。'
  );
  if (!res.recipe) throw new Error('レシピのまとめに失敗しました。');
  return res.recipe;
}

/**
 * テキストからレシピ情報を抽出する
 */
export async function extractRecipeFromText(text: string): Promise<Partial<Recipe>> {
  const res = await call({ action: 'extractText', text }, 'レシピの解析に失敗しました。テキストの内容を確認して再度お試しください。');
  if (!res.recipe) throw new Error('レシピの解析に失敗しました。');
  return res.recipe;
}

/**
 * 画像からレシピ情報を抽出する
 */
export async function extractRecipeFromImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<Partial<Recipe>> {
  const res = await call(
    { action: 'extractImage', base64: base64Data, mimeType: normalizeMime(mimeType) },
    '画像からのレシピ解析に失敗しました。画像を確認して再度お試しください。'
  );
  if (!res.recipe) throw new Error('画像からのレシピ解析に失敗しました。');
  return res.recipe;
}

/**
 * WebページのURLからレシピ情報を抽出する（ページ取得はサーバー側で行うためCORSの影響を受けない）
 */
export async function extractRecipeFromUrl(url: string): Promise<Partial<Recipe>> {
  const res = await call({ action: 'extractUrl', url }, 'URLからのレシピ解析に失敗しました。URLを確認して再度お試しください。');
  if (!res.recipe) throw new Error('URLからのレシピ解析に失敗しました。');
  return res.recipe;
}
