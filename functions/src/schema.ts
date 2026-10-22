// callable の入出力スキーマ（zod）
import { z } from 'zod';

/** アプリ側 types/recipe.ts の Recipe（id/userId/createdAt を除く）と同じ形 */
export const RecipeSchema = z.object({
  title: z.string(),
  image: z.string(),
  tags: z.array(z.string()),
  servings: z.string(),
  metadata: z.object({
    estimatedTime: z.string(),
    calories: z.string(),
  }),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string(),
    })
  ),
  steps: z.array(z.string()),
});
export type RecipeOutput = z.infer<typeof RecipeSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().max(4000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const HistorySchema = z.array(ChatMessageSchema).max(60);

/** 画像は base64 で最大 ~5MB（Claude の1画像上限）。base64 は 4/3 倍になるので 7MB 文字まで */
const MAX_IMAGE_BASE64_CHARS = 7_000_000;

export const RequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('chat'),
    history: HistorySchema,
    message: z.string().min(1).max(4000),
  }),
  z.object({
    action: z.literal('finalize'),
    history: HistorySchema.min(1),
  }),
  z.object({
    action: z.literal('extractText'),
    text: z.string().min(1).max(40_000),
  }),
  z.object({
    action: z.literal('extractImage'),
    base64: z.string().min(1).max(MAX_IMAGE_BASE64_CHARS),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  }),
  z.object({
    action: z.literal('extractUrl'),
    url: z.string().url().max(2000),
  }),
]);
export type AiRequest = z.infer<typeof RequestSchema>;
