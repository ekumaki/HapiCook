// contexts/AuthContext.tsx
// 認証状態の管理（匿名ログイン + Google Sign-In + 個人利用制限）

import {
    getUserDisplayName,
    getUserPhotoURL,
    isAllowedUser,
    isGoogleUser,
    signInWithGoogle,
    signOutUser,
} from '@/services/authService';
import { auth } from '@/services/firebaseConfig';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isAuthLoading: boolean;
    isGoogleLinked: boolean;
    /** 個人利用モードで許可されたユーザーかどうか */
    isAllowed: boolean;
    displayName: string;
    photoURL: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log(
                    'Auth: ログイン済み (UID):',
                    currentUser.uid,
                    currentUser.isAnonymous ? '(匿名)' : `(${currentUser.email})`
                );
                setUser(currentUser);
                setIsAuthLoading(false);
            } else {
                console.log('Auth: 未ログイン。匿名ログインを開始...');
                setUser(null);
                signInAnonymously(auth).catch((error) => {
                    console.error('Auth: 匿名ログインエラー:', error);
                    setIsAuthLoading(false);
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSignInWithGoogle = async () => {
        const signedInUser = await signInWithGoogle();
        // linkWithPopup はUIDが変わらないため onAuthStateChanged が発火しないことがある。
        // 最新のユーザー情報（email, providerData）を反映するために明示的に更新する。
        setUser({ ...signedInUser } as User);
    };

    const handleSignOut = async () => {
        // サインアウト後は onAuthStateChanged が null を検知して匿名ログインに戻る
        await signOutUser();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthLoading,
                isGoogleLinked: isGoogleUser(user),
                isAllowed: isAllowedUser(user),
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
