// services/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// .env ファイルから環境変数を読み込んで設定します
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 2. Authentication（認証）の初期化
// Web環境: getAuth()（ブラウザ標準の永続化を使用）
// ネイティブ環境: initializeAuth() + AsyncStorage（ログイン状態をローカルに保持）
let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
}

// 3. Firestore（データベース）と Storage（写真）の初期化
const db = getFirestore(app);
const storage = getStorage(app);

// 他のファイルから使えるようにエクスポート
export { auth, db, storage };

