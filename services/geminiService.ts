import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types/recipe';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// 常に最新の安定版Flashモデルを指すエイリアス
// （固定バージョン指定だとモデル廃止でアプリが動かなくなるため）
const GEMINI_MODEL = 'gemini-flash-latest';

// プロンプトの定義
const SYSTEM_PROMPT = `
あなたはプロの料理研究家であり、データエンジニアです。
提供されたテキスト情報から料理のレシピ情報を正確に抽出し、指定されたJSONフォーマットで返してください。

【出力ルール】
1. 言語は日本語で出力してください。
2. 以下のJSON構造に厳密に従ってください。
3. テキストから情報を取得できないフィールドは空の値（文字列なら""、配列なら[]）にしてください。
4. JSONのみを返してください。マークダウンの装飾などは不要です。
5. tags（タグ）には、必ず「主菜」「副菜」「ご飯・麺・パン」「デザート」のうち該当するものを1つ以上含めてください（どうしても判断に迷う場合は「主菜」を付与してください）。その他、食材や特徴などのタグも自由に追加して構いません。

【JSONフォーマット】
{
  "title": "料理名",
  "image": "",
  "tags": ["タグ1", "タグ2"],
  "servings": "何人分か（例：2人分）",
  "metadata": {
    "estimatedTime": "調理時間（例：15分）",
    "calories": "カロリー（例：350kcal）※不明なら空文字"
  },
  "ingredients": [
    { "name": "材料名1", "quantity": "分量1" }
  ],
  "steps": [
    "手順1",
    "手順2"
  ]
}
`;

// AIチャット（レシピ相談）用のシステムプロンプト
const CHAT_SYSTEM_PROMPT = `
あなたは親しみやすいプロの料理研究家「ハピクックAI」です。
ユーザーと会話しながら、その人にぴったりのレシピを一緒に考えます。

【会話のルール】
1. 日本語で、フレンドリーかつ簡潔に答えてください（1回の返答は長くても300文字程度）。
2. 最初のうちは、手持ちの食材・調理時間・人数・気分（さっぱり/がっつり等）などを自然に質問して要望を把握してください。ただし質問攻めにはせず、1回の返答で質問は1〜2個までにしてください。
3. 要望がある程度わかったら、具体的なレシピ（料理名・材料・作り方の概要）を提案してください。
4. ユーザーが「それにする」「いいね」など決定の意思を示したら、レシピの詳細（材料の分量、手順）を整理して伝え、画面下の「レシピにまとめる」ボタンで保存できることを案内してください。
5. マークダウン記法（**太字**や#見出し）は使わず、プレーンテキストで答えてください。箇条書きには「・」を使ってください。
6. 料理と関係のない話題には丁寧にお断りして、料理の話に戻してください。
`;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * AIチャット: 会話履歴を引き継いでメッセージを送り、AIの返答を得る
 */
export async function sendRecipeChatMessage(
  history: ChatMessage[],
  message: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: CHAT_SYSTEM_PROMPT,
  });

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
  });

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    throw new Error('AIとの通信に失敗しました。しばらくしてから再度お試しください。');
  }
}

/**
 * AIチャット: これまでの会話内容からレシピJSONを生成する
 */
export async function finalizeRecipeFromChat(
  history: ChatMessage[]
): Promise<Partial<Recipe>> {
  if (!API_KEY) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  });

  const conversation = history
    .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.text}`)
    .join('\n\n');

  const prompt = `${SYSTEM_PROMPT}

以下はユーザーとAI料理研究家の会話です。この会話で最終的に決まったレシピを、上記のJSONフォーマットで出力してください。
会話の中で分量や手順が明示されていない部分は、料理の常識に基づいて適切に補完してください。

【会話ログ】
${conversation}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedJson = jsonMatch ? jsonMatch[0] : responseText;

    const recipeData = JSON.parse(cleanedJson);
    return recipeData as Partial<Recipe>;
  } catch (error) {
    console.error('Gemini Finalize Error:', error);
    throw new Error('レシピのまとめに失敗しました。もう少し会話でレシピの内容を固めてから再度お試しください。');
  }
}

/**
 * テキストからレシピ情報を抽出する
 */
export async function extractRecipeFromText(text: string): Promise<Partial<Recipe>> {
  if (!API_KEY) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  });

  const prompt = `${SYSTEM_PROMPT}\n\n解析対象のテキスト:\n${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // JSONとしてパース（マークダウン装飾の除去）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedJson = jsonMatch ? jsonMatch[0] : responseText;

    const recipeData = JSON.parse(cleanedJson);
    return recipeData as Partial<Recipe>;
  } catch (error) {
    console.error('Gemini Text Extraction Error:', error);
    throw new Error('レシピの解析に失敗しました。テキストの内容を確認して再度お試しください。');
  }
}

/**
 * 画像からレシピ情報を抽出する（Gemini マルチモーダル）
 */
export async function extractRecipeFromImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<Partial<Recipe>> {
  if (!API_KEY) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  });

  const imagePrompt = `${SYSTEM_PROMPT}\n\nこの画像に写っている料理のレシピ情報を抽出してください。
画像がレシピ本やレシピサイトのスクリーンショットの場合は、書かれている内容を正確に読み取ってください。
画像から読み取れない情報（カロリーなど）は空の値にしてください。`;

  try {
    const result = await model.generateContent([
      imagePrompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);
    const response = await result.response;
    const responseText = response.text();

    // JSONとしてパース（マークダウン装飾の除去）
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanedJson = jsonMatch ? jsonMatch[0] : responseText;

    const recipeData = JSON.parse(cleanedJson);
    return recipeData as Partial<Recipe>;
  } catch (error) {
    console.error('Gemini Image Extraction Error:', error);
    throw new Error('画像からのレシピ解析に失敗しました。画像を確認して再度お試しください。');
  }
}
