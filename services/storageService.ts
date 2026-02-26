// services/storageService.ts
// Firebase Storage への画像アップロードサービス

import { storage } from '@/services/firebaseConfig';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * 画像URIがローカルファイル（アップロード対象）かどうかを判定
 * - file:// や blob: で始まるURI → ローカルファイル（アップロード必要）
 * - https://images.unsplash.com 等 → 既にWeb上にあるのでスキップ
 */
export function isLocalImageUri(uri: string): boolean {
    if (!uri) return false;
    return (
        uri.startsWith('file://') ||
        uri.startsWith('blob:') ||
        uri.startsWith('data:') ||
        uri.startsWith('content://') ||
        // Expo Web の ImagePicker は blob URL を返す
        (uri.startsWith('http://localhost') && uri.includes('blob'))
    );
}

/**
 * 画像をFirebase Storageにアップロードし、ダウンロードURLを返す
 *
 * @param imageUri - ローカルの画像URI（file://, blob:, data: 等）
 * @param userId - ユーザーUID（フォルダ分けに使用）
 * @param recipeId - レシピID（ファイル名に使用）
 * @returns Firebase Storage のダウンロードURL
 */
export async function uploadRecipeImage(
    imageUri: string,
    userId: string,
    recipeId: string
): Promise<string> {
    try {
        console.log('Storage: 画像アップロード開始...', { imageUri: imageUri.substring(0, 50) });

        // 1. 画像データを取得（Blob に変換）
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // 2. ファイルの拡張子を判定
        const contentType = blob.type || 'image/jpeg';
        const extension = contentType.includes('png') ? 'png' : 'jpg';

        // 3. Storage のパスを作成: users/{userId}/recipes/{recipeId}.{ext}
        const storagePath = `users/${userId}/recipes/${recipeId}.${extension}`;
        const storageRef = ref(storage, storagePath);

        // 4. アップロード
        const snapshot = await uploadBytes(storageRef, blob, {
            contentType: contentType,
        });

        // 5. ダウンロードURLを取得
        const downloadUrl = await getDownloadURL(snapshot.ref);

        console.log('Storage: 画像アップロード完了:', downloadUrl.substring(0, 80) + '...');
        return downloadUrl;
    } catch (error) {
        console.error('Storage: 画像アップロードエラー:', error);
        throw error;
    }
}

/**
 * Firebase Storage からレシピ画像を削除する
 *
 * @param userId - ユーザーUID
 * @param recipeId - レシピID
 */
export async function deleteRecipeImage(
    userId: string,
    recipeId: string
): Promise<void> {
    // jpg と png の両方を試す（どちらで保存されたか不明なため）
    const extensions = ['jpg', 'png'];

    for (const ext of extensions) {
        try {
            const storagePath = `users/${userId}/recipes/${recipeId}.${ext}`;
            const storageRef = ref(storage, storagePath);
            await deleteObject(storageRef);
            console.log('Storage: 画像を削除しました:', storagePath);
            return; // 削除成功したら終了
        } catch (error: any) {
            // ファイルが見つからない場合は次の拡張子を試す
            if (error?.code === 'storage/object-not-found') {
                continue;
            }
            console.error('Storage: 画像削除エラー:', error);
        }
    }
    // どちらも見つからない場合（外部URLの画像等）はログのみ
    console.log('Storage: 削除対象の画像がありませんでした（外部URL等）');
}
