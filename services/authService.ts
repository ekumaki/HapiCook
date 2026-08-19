// services/authService.ts
// Google Sign-In と個人利用制限のロジック

import { auth } from '@/services/firebaseConfig';
import {
    GoogleAuthProvider,
    linkWithPopup,
    signInWithCredential,
    signInWithPopup,
    signOut,
    User,
} from 'firebase/auth';
import { Platform } from 'react-native';

// 個人利用モード: このメールアドレスのみ利用を許可（空なら制限なし）
export const ALLOWED_EMAIL = process.env.EXPO_PUBLIC_ALLOWED_EMAIL || '';

/**
 * Googleサインイン
 * - 匿名ユーザーの場合: linkWithPopup で匿名アカウントにGoogleをリンク（UIDが変わらず既存データを引き継げる）
 * - リンク先のGoogleアカウントが既に使用済みの場合: そのアカウントで直接サインイン
 */
export async function signInWithGoogle(): Promise<User> {
    if (Platform.OS !== 'web') {
        throw new Error(
            'ネイティブ版のGoogleサインインは未対応です。Web版をご利用ください。'
        );
    }

    const provider = new GoogleAuthProvider();
    const currentUser = auth.currentUser;

    // 匿名ユーザー → Googleアカウントへリンク（UID維持でデータ引き継ぎ）
    if (currentUser && currentUser.isAnonymous) {
        try {
            const result = await linkWithPopup(currentUser, provider);
            return result.user;
        } catch (error: any) {
            // このGoogleアカウントが既に別UIDで使用済み → そのアカウントでサインイン
            if (error.code === 'auth/credential-already-in-use') {
                const credential = GoogleAuthProvider.credentialFromError(error);
                if (credential) {
                    const result = await signInWithCredential(auth, credential);
                    return result.user;
                }
            }
            throw error;
        }
    }

    // 匿名でない（未ログイン or 別アカウント）→ 通常サインイン
    const result = await signInWithPopup(auth, provider);
    return result.user;
}

/**
 * サインアウト（onAuthStateChanged 経由で匿名ユーザーに戻る）
 */
export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

/**
 * Googleアカウントでログイン済みかどうか
 */
export function isGoogleUser(user: User | null): boolean {
    if (!user) return false;
    return user.providerData.some(
        (provider) => provider.providerId === 'google.com'
    );
}

/**
 * このアプリの利用が許可されたユーザーかどうか（個人利用モード）
 * ALLOWED_EMAIL が未設定の場合は誰でも利用可（開発時のフォールバック）
 */
export function isAllowedUser(user: User | null): boolean {
    if (!user) return false;
    if (!ALLOWED_EMAIL) return true;
    return !user.isAnonymous && user.email === ALLOWED_EMAIL;
}

export function getUserDisplayName(user: User | null): string {
    if (!user || user.isAnonymous) return 'ゲスト';
    return user.displayName || user.email || 'ユーザー';
}

export function getUserPhotoURL(user: User | null): string | null {
    if (!user || user.isAnonymous) return null;
    return user.photoURL;
}
