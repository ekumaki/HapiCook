// components/auth/LoginGate.tsx
// 個人利用モード: 許可ユーザー以外にはログイン画面を表示し、アプリ本体を隠す

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function LoginGate({ children }: { children: React.ReactNode }) {
    const { user, isAuthLoading, isAllowed, isGoogleLinked, displayName, signInWithGoogle, signOut } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 許可ユーザーはそのままアプリ本体へ
    if (isAllowed) {
        return <>{children}</>;
    }

    const handleSignIn = async () => {
        setErrorMessage('');
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            console.error('LoginGate: サインインエラー:', error);
            if (error?.code === 'auth/popup-closed-by-user') {
                // ユーザーが閉じただけなのでエラー表示しない
            } else if (error?.code === 'auth/operation-not-allowed') {
                setErrorMessage('Google Sign-In が有効化されていません。Firebase Console で有効にしてください。');
            } else {
                setErrorMessage(error?.message || 'サインインに失敗しました。');
            }
        } finally {
            setIsSigningIn(false);
        }
    };

    // Googleログイン済みだが許可されていないアカウント
    const isWrongAccount = isGoogleLinked && !isAllowed;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="restaurant" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.title}>ハピクック</Text>

                {isAuthLoading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
                ) : isWrongAccount ? (
                    <>
                        <Text style={styles.subtitle}>
                            このアプリは個人利用のため、{'\n'}このアカウント（{displayName}）ではご利用いただけません。
                        </Text>
                        <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
                            <Text style={styles.signOutButtonText}>別のアカウントでサインイン</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            ご利用にはGoogleアカウントでの{'\n'}サインインが必要です。
                        </Text>
                        <TouchableOpacity
                            style={[styles.signInButton, isSigningIn && styles.signInButtonDisabled]}
                            onPress={handleSignIn}
                            disabled={isSigningIn}
                        >
                            {isSigningIn ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={20} color="#fff" />
                                    <Text style={styles.signInButtonText}>Googleでサインイン</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    loading: {
        marginVertical: 24,
    },
    signInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 26,
        paddingHorizontal: 32,
        alignSelf: 'stretch',
    },
    signInButtonDisabled: {
        opacity: 0.7,
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    signOutButton: {
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        alignSelf: 'stretch',
    },
    signOutButtonText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 16,
        fontSize: 13,
        color: Colors.error,
        textAlign: 'center',
    },
});
