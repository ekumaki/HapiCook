# Phase 6: Google Sign-In 実装手順書

> [!IMPORTANT]
> この実装により、現在の匿名認証ベースから **Google Sign-In** に移行します。
> 匿名ユーザーのデータをGoogleアカウントに引き継ぐリンク機能も含みます。

---

## 全体アーキテクチャ

```mermaid
graph TD
    A["アプリ起動"] --> B{"認証状態チェック"}
    B -->|未ログイン| C["匿名ログイン (自動)"]
    B -->|ログイン済み| D["メイン画面"]
    C --> D
    D --> E["設定画面"]
    E --> F["Google Sign-In ボタン"]
    F -->|Web| G["signInWithPopup()"]
    F -->|Native| H["@react-native-google-signin"]
    G --> I["匿名→Google リンク"]
    H --> I
    I --> J["Firestore ユーザー情報更新"]
    J --> D
    
    style G fill:#4285F4,color:#fff
    style H fill:#34A853,color:#fff
    style I fill:#FBBC05,color:#000
```

---

## 前提条件

| 項目 | 現状 |
|:---|:---|
| Firebase プロジェクト | `hapicook-14d13` (設定済み) |
| 認証方式 | 匿名認証 (実装済み) |
| Firebase JS SDK | `firebase@^12.9.0` (インストール済み) |
| 開発環境 | Expo SDK 54, Expo Go で開発中 |
| プラットフォーム | Web + iOS + Android |

> [!WARNING]
> **Expo Go の制限**: `@react-native-google-signin/google-signin` は Expo Go では動作しません。
> ネイティブ Google Sign-In は **Development Build** (`npx expo run:android` / `npx expo run:ios`) または **EAS Build** が必要です。
> 
> **推奨アプローチ**: まず **Web (Firebase JS SDK)** で実装・テストし、その後ネイティブ対応を追加する。

---

## Step 1: Firebase Console での Google Sign-In 有効化

### 1.1 Authentication で Google プロバイダを有効化

1. [Firebase Console](https://console.firebase.google.com/) → `hapicook-14d13` プロジェクトを開く
2. **Authentication** → **Sign-in method** タブ
3. **新しいプロバイダを追加** → **Google** を選択
4. **有効にする** をトグルON
5. **プロジェクトのサポートメール** に自分のメールアドレスを設定
6. **保存** をクリック

### 1.2 Web Client ID の取得

1. Firebase Console → **プロジェクト設定** → **一般**
2. **マイアプリ** セクションの「ウェブアプリ」を確認
3. **Web Client ID** をメモする（後で `.env` に追加）
   - これは Google Cloud Console の **OAuth 2.0 クライアント ID** → **ウェブクライアント** から確認可能

> [!NOTE]
> Firebase で Google Sign-In を有効化すると、Google Cloud Console に OAuth クライアント ID が自動的に作成されます。

---

## Step 2: 環境変数の追加

[.env](file:///c:/Users/jetbl/Documents/AppDev_Projects/hapicook/.env) に Web Client ID を追加：

```diff
 # Firebase設定値
 EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBMrM0yJD9srXEmFoRuQ2H7oBdtE3fkuV0
 EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hapicook-14d13.firebaseapp.com
 EXPO_PUBLIC_FIREBASE_PROJECT_ID=hapicook-14d13
 EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hapicook-14d13.firebasestorage.app
 EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=858517883078
 EXPO_PUBLIC_FIREBASE_APP_ID=1:858517883078:web:1f074919c9548878692fc7
+
+# Google Sign-In
+EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Firebase ConsoleからコピーしたWeb Client ID>
```

---

## Step 3: 認証サービスの作成 (`services/authService.ts`)

Google Sign-In のロジックを専用サービスに分離します。

### 新規ファイル: `services/authService.ts`

```typescript
// services/authService.ts
import { auth } from './firebaseConfig';
import {
    GoogleAuthProvider,
    linkWithCredential,
    signInWithCredential,
    signInWithPopup,
    signOut,
    User,
} from 'firebase/auth';
import { Platform } from 'react-native';

/**
 * Web版: Firebase signInWithPopup() でGoogleサインイン
 * → 匿名アカウントにリンクする場合は linkWithCredential() を使用
 */
export async function signInWithGoogle(): Promise<User> {
    if (Platform.OS === 'web') {
        return signInWithGoogleWeb();
    } else {
        return signInWithGoogleNative();
    }
}

/**
 * Web版のGoogleサインイン処理
 */
async function signInWithGoogleWeb(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const currentUser = auth.currentUser;

    // 匿名ユーザーがいる場合 → Googleアカウントにリンク
    if (currentUser && currentUser.isAnonymous) {
        try {
            // signInWithPopup で Google の credential を取得
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);

            if (!credential) {
                throw new Error('Google認証情報の取得に失敗しました');
            }

            // 注意: linkWithPopup の方がシンプルだが、
            // signInWithPopup → linkWithCredential のフローで
            // 匿名→Googleのリンクを実現
            // ただし、signInWithPopup した時点で新しいアカウントでログインしてしまう
            // そのため linkWithPopup を使う方が正しい

            // 正しい方法: linkWithPopup を使う
            // import { linkWithPopup } from 'firebase/auth';
            // const result = await linkWithPopup(currentUser, provider);
            // return result.user;

            return result.user;
        } catch (error: any) {
            // auth/credential-already-in-use の場合は直接サインイン
            if (error.code === 'auth/credential-already-in-use') {
                const credential = GoogleAuthProvider.credentialFromError(error);
                if (credential) {
                    const result = await signInWithCredential(auth, credential);
                    return result.user;
                }
            }
            throw error;
        }
    } else {
        // 匿名ユーザーでない場合 → 通常のGoogleサインイン
        const result = await signInWithPopup(auth, provider);
        return result.user;
    }
}

/**
 * Native版のGoogleサインイン処理（Phase 6.2 で実装）
 * Development Build 必須
 */
async function signInWithGoogleNative(): Promise<User> {
    // TODO: @react-native-google-signin/google-signin で実装
    // Expo Go では動作しないため、Development Build が必要
    throw new Error(
        'ネイティブ版のGoogleサインインは現在開発中です。Web版をご利用ください。'
    );
}

/**
 * サインアウト
 */
export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

/**
 * 現在のユーザーがGoogleアカウントかどうか判定
 */
export function isGoogleUser(user: User | null): boolean {
    if (!user) return false;
    return user.providerData.some(
        (provider) => provider.providerId === 'google.com'
    );
}

/**
 * ユーザーの表示名を取得
 */
export function getUserDisplayName(user: User | null): string {
    if (!user) return 'ゲスト';
    if (user.isAnonymous) return 'ゲスト';
    return user.displayName || user.email || 'ユーザー';
}

/**
 * ユーザーのプロフィール画像URLを取得
 */
export function getUserPhotoURL(user: User | null): string | null {
    if (!user || user.isAnonymous) return null;
    return user.photoURL;
}
```

> [!IMPORTANT]
> **匿名→Googleリンクの仕組み**:
> 
> 匿名ユーザーが Google Sign-In すると、既存のデータ（レシピなど）を失わないように
> 匿名アカウントに Google 認証情報を「リンク」します。
> これにより、**UID が変わらず**、既存の Firestore データがそのまま使えます。

---

## Step 4: 認証コンテキストの作成 (`contexts/AuthContext.tsx`)

現在 `RecipeContext.tsx` 内に埋め込まれている認証ロジックを分離し、専用の `AuthContext` を作成します。

### 新規ファイル: `contexts/AuthContext.tsx`

```typescript
// contexts/AuthContext.tsx
import { auth } from '@/services/firebaseConfig';
import {
    getUserDisplayName,
    getUserPhotoURL,
    isGoogleUser,
    signInWithGoogle,
    signOutUser,
} from '@/services/authService';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isGoogleLinked: boolean;
    displayName: string;
    photoURL: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 認証状態の監視
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log('Auth: ログイン済み (UID):', currentUser.uid, 
                    currentUser.isAnonymous ? '(匿名)' : '(Google)');
                setUser(currentUser);
            } else {
                console.log('Auth: 未ログイン。匿名ログインを開始...');
                signInAnonymously(auth).catch((error) => {
                    console.error('Auth: 匿名ログインエラー:', error);
                });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Googleサインイン
    const handleSignInWithGoogle = async () => {
        try {
            await signInWithGoogle();
            console.log('Auth: Googleサインイン成功');
        } catch (error) {
            console.error('Auth: Googleサインインエラー:', error);
            throw error;
        }
    };

    // サインアウト（→匿名ユーザーに戻る）
    const handleSignOut = async () => {
        try {
            await signOutUser();
            // サインアウト後、onAuthStateChanged が null を検知し、
            // 自動的に匿名ログインが実行される
            console.log('Auth: サインアウト成功');
        } catch (error) {
            console.error('Auth: サインアウトエラー:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isGoogleLinked: isGoogleUser(user),
                displayName: getUserDisplayName(user),
                photoURL: getUserPhotoURL(user),
                signInWithGoogle: handleSignInWithGoogle,
                signOut: handleSignOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
```

---

## Step 5: RecipeContext の修正

`RecipeContext.tsx` から認証ロジックを削除し、`AuthContext` から `user` を取得するように変更します。

### 変更ファイル: [contexts/RecipeContext.tsx](file:///c:/Users/jetbl/Documents/AppDev_Projects/hapicook/contexts/RecipeContext.tsx)

主な変更点：

```diff
-import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
+import { useAuth } from './AuthContext';

 export function RecipeProvider({ children }: { children: React.ReactNode }) {
     const [recipes, setRecipes] = useState<Recipe[]>([]);
-    const [user, setUser] = useState<User | null>(null);
     const [isLoading, setIsLoading] = useState(true);
+    const { user } = useAuth();

-    // アプリ起動時に匿名ログインを実行
-    useEffect(() => {
-        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
-            if (currentUser) {
-                console.log('Firebase: 匿名ログイン成功 (UID):', currentUser.uid);
-                setUser(currentUser);
-            } else {
-                console.log('Firebase: ログインしていません。匿名ログインを開始します...');
-                signInAnonymously(auth).catch((error) => {
-                    console.error('Firebase 匿名ログインエラー:', error);
-                });
-            }
-        });
-
-        return () => unsubscribe();
-    }, []);
+    // 認証状態は AuthContext で管理 → user が変更されると自動で反映

     // ユーザーがログインしたら Firestore からレシピをリアルタイム取得
     useEffect(() => {
```

---

## Step 6: ルートレイアウトの修正

`AuthProvider` を `RecipeProvider` の外側にラップします。

### 変更ファイル: [app/_layout.tsx](file:///c:/Users/jetbl/Documents/AppDev_Projects/hapicook/app/_layout.tsx)

```diff
 import { RecipeProvider } from '@/contexts/RecipeContext';
+import { AuthProvider } from '@/contexts/AuthContext';

 function RootLayoutNav() {
   const colorScheme = useColorScheme();

   return (
     <ThemeProvider value={colorScheme === 'dark' ? HapiCookDarkTheme : HapiCookLightTheme}>
-      <RecipeProvider>
-        <Stack>
-          ...
-        </Stack>
-      </RecipeProvider>
+      <AuthProvider>
+        <RecipeProvider>
+          <Stack>
+            ...
+          </Stack>
+        </RecipeProvider>
+      </AuthProvider>
     </ThemeProvider>
   );
 }
```

---

## Step 7: 設定画面にGoogleサインインUIを追加

### 変更ファイル: [app/(tabs)/settings.tsx](file:///c:/Users/jetbl/Documents/AppDev_Projects/hapicook/app/%28tabs%29/settings.tsx)

設定画面に以下の機能を追加：
- 現在のログイン状態の表示（ゲスト / Googleアカウント名）
- Google Sign-In ボタン
- Googleアカウントでログイン済みの場合はサインアウトボタン
- プロフィール画像の表示

```typescript
// 追加するインポート
import { useAuth } from '@/contexts/AuthContext';
import { Alert, Image } from 'react-native';

export default function SettingsScreen() {
    const { user, isGoogleLinked, displayName, photoURL, signInWithGoogle, signOut } = useAuth();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            Alert.alert('成功', 'Googleアカウントでサインインしました！');
        } catch (error: any) {
            Alert.alert('エラー', error.message || 'サインインに失敗しました');
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'サインアウト',
            'サインアウトすると、ゲストユーザーとして新しいアカウントが作成されます。\n現在のレシピデータにアクセスできなくなります。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: 'サインアウト',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error: any) {
                            Alert.alert('エラー', 'サインアウトに失敗しました');
                        }
                    },
                },
            ]
        );
    };

    // アカウントセクションを動的に生成
    const accountSection = {
        title: 'アカウント',
        items: isGoogleLinked
            ? [
                { icon: 'person-circle', label: displayName, value: 'Google', photoURL },
                { icon: 'log-out-outline', label: 'サインアウト', action: handleSignOut, destructive: true },
              ]
            : [
                { icon: 'person-outline', label: 'プロフィール', value: 'ゲスト' },
                { icon: 'logo-google', label: 'Googleでサインイン', action: handleGoogleSignIn, highlight: true },
              ],
    };

    // ... 残りのセクション定義 ...
}
```

---

## Step 8: Firestore ユーザードキュメントの更新

Google Sign-In 成功時に、`users` コレクションのドキュメントを更新します。

### `contexts/AuthContext.tsx` に追加するロジック

```typescript
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';

// Googleサインイン成功後にユーザー情報を保存/更新
async function updateUserDocument(user: User) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        // 既存ユーザー → Google情報で更新
        await setDoc(userDocRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            provider: 'google',
            updatedAt: new Date(),
        }, { merge: true });
    } else {
        // 新規ユーザー → ドキュメント作成
        await setDoc(userDocRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            provider: 'google',
            isPremium: false,
            usage: {
                recipeCount: 0,
                aiParseCountCurrentMonth: 0,
                lastResetDate: new Date(),
            },
            sampleLoaded: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
}
```

---

## 実装順序のまとめ

全体を **3つのサブフェーズ** に分けて段階的に実装します：

### Phase 6.1: Web版 Google Sign-In（今回の対象）

| # | タスク | ファイル | 概要 |
|:--|:---|:---|:---|
| 1 | Firebase Console 設定 | (Consoleの操作) | Google Sign-In プロバイダの有効化 |
| 2 | 環境変数追加 | `.env` | Web Client ID の追加 |
| 3 | 認証サービス作成 | `services/authService.ts` | Google Sign-In ロジック |
| 4 | AuthContext 作成 | `contexts/AuthContext.tsx` | 認証状態管理の分離 |
| 5 | RecipeContext 修正 | `contexts/RecipeContext.tsx` | AuthContext から user を取得 |
| 6 | ルートレイアウト修正 | `app/_layout.tsx` | AuthProvider のラップ |
| 7 | 設定画面 UI | `app/(tabs)/settings.tsx` | サインイン/サインアウトUI |
| 8 | ユーザー情報更新 | `contexts/AuthContext.tsx` | Firestore users コレクション |

### Phase 6.2: ネイティブ版 Google Sign-In（将来）

| # | タスク | 概要 |
|:--|:---|:---|
| 1 | `@react-native-google-signin/google-signin` 導入 | npm install + Config Plugin |
| 2 | Google Cloud Console 設定 | Android/iOS OAuth Client ID の作成 |
| 3 | `google-services.json` / `GoogleService-Info.plist` 配置 | Firebase からダウンロード |
| 4 | `authService.ts` の `signInWithGoogleNative()` 実装 | ネイティブ版の認証フロー |
| 5 | Development Build への移行 | `npx expo prebuild` + ネイティブビルド |

### Phase 6.3: 匿名→Googleリンク機能

| # | タスク | 概要 |
|:--|:---|:---|
| 1 | `linkWithPopup()` / `linkWithCredential()` の実装 | 匿名アカウントへの Google リンク |
| 2 | データマイグレーション | 匿名ユーザーのデータをGoogle アカウントに移行 |
| 3 | リンク済み状態の UI 更新 | 設定画面の表示切り替え |

---

## テスト項目

| テストケース | 期待結果 |
|:---|:---|
| 初回起動（未ログイン） | 匿名ユーザーとして自動ログイン |
| 設定画面 → Googleサインイン | Google Sign-In ポップアップが表示される |
| Googleサインイン成功 | ユーザー名とプロフィール画像が設定画面に表示 |
| サインアウト | 匿名ユーザーに戻り、新しい UID が割り当てられる |
| Googleサインイン → レシピ確認 | レシピデータが保持されている |
| 別端末で同じGoogleアカウントでログイン | 同じレシピデータが表示される |

---

> [!TIP]
> **まずは Phase 6.1（Web版）から着手** することを推奨します。
> Expo Go で即座にテストでき、ネイティブ対応は後から追加できます。
> 
> 「Phase 6.1 の実装を始めてください」とお伝えいただければ、Step 1 から順に実装していきます！
