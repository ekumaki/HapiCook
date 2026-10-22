// Claude API 呼び出し（キーはサーバー側のみ）
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { CHAT_SYSTEM_PROMPT, EXTRACT_SYSTEM_PROMPT } from './prompts.js';
import { ChatMessage, RecipeOutput, RecipeSchema } from './schema.js';

const MODEL = 'claude-opus-5-5';

// 安全分類器による拒否時に、サーバー側で別モデルへ自動フォールバックする（Opus 5.5 標準の推奨設定）
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** 1レスポンスの上限。レシピJSONやチャット返答なら十分 */
const MAX_TOKENS = 4096;

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, maxRetries: 2, timeout: 90_000 });
}

function textOf(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
    .trim();
}

/** AIチャット: 会話履歴を引き継いで返答を得る */
export async function chat(apiKey: string, history: ChatMessage[], message: string): Promise<string> {
  const client = createClient(apiKey);
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: CHAT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages,
    output_config: { effort: 'low' },
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('AIがこの内容には回答できませんでした。別の言い方でお試しください。');
  }
  const text = textOf(response.content);
  if (!text) throw new Error('AIから空の応答が返りました。もう一度お試しください。');
  return text;
}

/** 構造化出力でレシピを抽出する共通処理 */
async function extractRecipe(
  apiKey: string,
  userContent: Anthropic.Beta.BetaContentBlockParam[],
  effort: 'low' | 'medium' | 'high' = 'medium'
): Promise<RecipeOutput> {
  const client = createClient(apiKey);
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: EXTRACT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userContent }],
    output_config: { effort, format: zodOutputFormat(RecipeSchema) },
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('AIがこの内容を処理できませんでした。内容を確認して再度お試しください。');
  }
  if (!response.parsed_output) {
    throw new Error('レシピの解析に失敗しました。内容を確認して再度お試しください。');
  }
  // image はアプリ側で設定するため常に空にそろえる
  return { ...response.parsed_output, image: '' };
}

/** テキストからレシピ抽出 */
export function extractFromText(apiKey: string, text: string): Promise<RecipeOutput> {
  return extractRecipe(apiKey, [{ type: 'text', text: `解析対象のテキスト:\n${text}` }]);
}

/** 画像からレシピ抽出（Claude の画像入力） */
export function extractFromImage(apiKey: string, base64: string, mimeType: ImageMediaType): Promise<RecipeOutput> {
  return extractRecipe(apiKey, [
    { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
    {
      type: 'text',
      text:
        'この画像に写っている料理のレシピ情報を抽出してください。\n' +
        '画像がレシピ本やレシピサイトのスクリーンショットの場合は、書かれている内容を正確に読み取ってください。\n' +
        '画像から読み取れない情報（カロリーなど）は空の値にしてください。',
    },
  ]);
}

/** Webページ本文（HTMLから抽出済みのテキスト）からレシピ抽出 */
export function extractFromPageText(apiKey: string, url: string, pageText: string): Promise<RecipeOutput> {
  return extractRecipe(apiKey, [
    {
      type: 'text',
      text:
        `以下は ${url} から取得したWebページのテキストです。ナビゲーションや広告などレシピと無関係な部分は無視して、レシピ情報を抽出してください。\n\n` +
        pageText,
    },
  ]);
}

/** チャット履歴からレシピJSONを確定する */
export function finalizeFromChat(apiKey: string, history: ChatMessage[]): Promise<RecipeOutput> {
  const conversation = history
    .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`)
    .join('\n\n');
  return extractRecipe(apiKey, [
    {
      type: 'text',
      text:
        '以下はユーザーとAI料理研究家の会話です。この会話で最終的に決まったレシピを抽出してください。\n' +
        '会話の中で分量や手順が明示されていない部分は、料理の常識に基づいて適切に補完してください。\n\n' +
        `【会話ログ】\n${conversation}`,
    },
  ]);
}
