import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { extractRecipeFromUrl } from '@/services/geminiService';

export default function AddLinkScreen() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!url.trim()) {
            Alert.alert('エラー', 'URLを入力してください');
            return;
        }

        if (!url.startsWith('http')) {
            Alert.alert('エラー', '有効なURLを入力してください（http://... または https://...）');
            return;
        }

        setIsLoading(true);
        try {
            const recipeData = await extractRecipeFromUrl(url);

            // 解析結果を持ってプレビュー画面へ遷移
            // 注意: 大容量のデータをパラムで渡すのは避けたいが、今回は簡単な構造なので一旦パラムまたは
            // 何らかの状態管理を使用する。
            // プレビュー画面が未作成の場合は、一旦コンソールに出力してAlertを出す
            router.push({
                pathname: '/recipe/preview',
                params: { data: JSON.stringify(recipeData) }
            });
        } catch (error: any) {
            Alert.alert('解析失敗', error.message || 'レシピの解析中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen
                options={{
                    title: 'Webリンクから登録',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="link" size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>URLからレシピを読み込む</Text>
                    <Text style={styles.subtitle}>
                        レシピサイトのURLを貼り付けるだけで、AIが材料や手順を自動で抽出します。
                    </Text>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>レシピのURL</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={url}
                            onChangeText={setUrl}
                            placeholder="https://example.com/recipe"
                            placeholderTextColor={Colors.textLight}
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            returnKeyType="go"
                            onSubmitEditing={handleAnalyze}
                            editable={!isLoading}
                        />
                        {url.length > 0 && !isLoading && (
                            <TouchableOpacity onPress={() => setUrl('')}>
                                <Ionicons name="close-circle" size={18} color={Colors.textLight} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.button, (!url.trim() || isLoading) && styles.buttonDisabled]}
                    onPress={handleAnalyze}
                    disabled={!url.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={20} color="#fff" />
                            <Text style={styles.buttonText}>AIでレシピを解析する</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
                    <Text style={styles.infoText}>
                        ※サイトによっては解析に時間がかかったり、正しく読み込めない場合があります。
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 24,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    inputSection: {
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: Colors.textLight,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoBox: {
        flexDirection: 'row',
        marginTop: 24,
        padding: 16,
        backgroundColor: Colors.borderLight,
        borderRadius: 12,
        gap: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});
