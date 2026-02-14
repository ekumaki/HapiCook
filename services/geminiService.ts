import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe } from '../types/recipe';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// プロンプトの定義
const SYSTEM_PROMPT = `
あなたはプロの料理研究家であり、データエンジニアです。
提供されたテキスト情報から料理のレシピ情報を正確に抽出し、指定されたJSONフォーマットで返してください。

【出力ルール】
1. 言語は日本語で出力してください。
2. 以下のJSON構造に厳密に従ってください。
3. テキストから情報を取得できないフィールドは空の値（文字列なら""、配列なら[]）にしてください。
4. JSONのみを返してください。マークダウンの装飾などは不要です。

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

/**
 * テキストからレシピ情報を抽出する
 */
export async function extractRecipeFromText(text: string): Promise<Partial<Recipe>> {
  if (!API_KEY) {
    throw new Error('Gemini APIキーが設定されていません。');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
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
    model: 'gemini-2.0-flash',
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
