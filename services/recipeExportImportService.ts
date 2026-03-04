import { Recipe } from '@/types/recipe';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ExportableRecipe extends Omit<Recipe, 'id' | 'userId' | 'createdAt'> { }

// エクスポートデータの構造定義
export interface RecipeExportData {
    version: string;
    exportedAt: string;
    app: string;
    recipeCount: number;
    recipes: ExportableRecipe[];
}

/**
 * レシピデータをエクスポートする
 * Web環境: ダウンロード
 * ネイティブ環境: 共有メニュー
 */
export const exportRecipesData = async (recipes: Recipe[]): Promise<void> => {
    const exportableRecipes: ExportableRecipe[] = recipes.map(({ id, userId, createdAt, ...rest }) => rest);

    const exportData: RecipeExportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        app: 'HapiCook',
        recipeCount: exportableRecipes.length,
        recipes: exportableRecipes,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    // ファイル名: hapicook_recipes_20260304.hapicook.json
    const filename = `hapicook_recipes_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.hapicook.json`;

    if (Platform.OS === 'web') {
        downloadJsonWeb(jsonString, filename);
    } else {
        await shareJsonNative(jsonString, filename);
    }
};

/**
 * Web環境でのJSONファイルダウンロード
 */
const downloadJsonWeb = (jsonString: string, filename: string) => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * ネイティブ環境でのJSONファイル共有（保存して共有）
 */
const shareJsonNative = async (jsonString: string, filename: string) => {
    try {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'レシピデータをエクスポート',
                UTI: 'public.json' // iOS用
            });
        } else {
            console.warn('共有機能が利用できません');
            // 必要に応じてAlertを表示
        }
    } catch (error) {
        console.error('エクスポートエラー:', error);
        throw error;
    }
};

/**
 * JSONファイルを選択して読み込み、レシピデータとして返す
 */
export const importRecipesData = async (): Promise<ExportableRecipe[] | null> => {
    try {
        const jsonString = await pickAndReadJsonFile();

        if (!jsonString) return null;

        return parseImportData(jsonString);
    } catch (error: any) {
        console.error('インポートエラー:', error);
        throw new Error(error.message || 'インポート中にエラーが発生しました。');
    }
};

/**
 * ファイル選択と読み込み (Web / Native 分岐)
 */
const pickAndReadJsonFile = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
        return pickAndReadJsonFileWeb();
    }

    // ネイティブ環境
    const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'public.json', '*/*'],
        copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
    }

    const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
    });

    return content;
};

/**
 * Web環境でのファイル選択と読み込み（<input type="file"> を使用）
 */
const pickAndReadJsonFileWeb = (): Promise<string | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (!file) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target?.result as string);
            };
            reader.onerror = () => resolve(null);
            reader.readAsText(file);
        };

        // キャンセル時の処理: focusイベントでファイルが選択されなかった場合にnullを返す
        const handleFocus = () => {
            setTimeout(() => {
                if (!input.files || input.files.length === 0) {
                    resolve(null);
                }
                window.removeEventListener('focus', handleFocus);
            }, 500);
        };
        window.addEventListener('focus', handleFocus);

        input.click();
    });
};

/**
 * JSON文字列をパースしてバリデーションを行う
 */
const parseImportData = (jsonString: string): ExportableRecipe[] => {
    try {
        const data = JSON.parse(jsonString);

        // HapiCookのエクスポートデータ形式かチェック
        if (!data || typeof data !== 'object') {
            throw new Error('無効なファイル形式です。JSONファイルを選択してください。');
        }

        let recipesData: any[] = [];

        // v1.0の形式（ラップされたオブジェクト）
        if (data.app === 'HapiCook' && Array.isArray(data.recipes)) {
            recipesData = data.recipes;
        }
        // 念のため、配列が直接渡された場合（レガシーや仕様変更の想定）
        else if (Array.isArray(data)) {
            recipesData = data;
        } else {
            throw new Error('HapiCookのエクスポートファイルではありません。');
        }

        // レシピごとのバリデーション
        const validRecipes = recipesData.filter(recipe => {
            // 最低限タイトルが必要
            return recipe && typeof recipe === 'object' && recipe.title && typeof recipe.title === 'string';
        });

        if (validRecipes.length === 0) {
            throw new Error('有効なレシピデータが見つかりませんでした。');
        }

        return validRecipes as ExportableRecipe[];
    } catch (error: any) {
        console.error('JSONパースエラー:', error);
        if (error instanceof SyntaxError) {
            throw new Error('ファイルの形式が正しくありません。(Syntax Error)');
        }
        throw new Error(error.message || 'ファイルの読み込みに失敗しました。');
    }
};
