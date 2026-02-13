import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { extractRecipeFromText } from '@/services/geminiService';

export default function AddTextScreen() {
    const router = useRouter();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = React.useRef<TextInput>(null);

    const handleAnalyze = async () => {
        if (!text.trim() || text.length < 10) {
            Alert.alert('入力エラー', '解析するレシピのテキストをもう少し詳しく入力してください（10文字以上）。');
            return;
        }

        setIsLoading(true);
        Keyboard.dismiss();

        try {
            const recipeData = await extractRecipeFromText(text);

            // 解析結果を持ってプレビュー画面へ遷移
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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <View style={{ flex: 1 }}>
                <Stack.Screen
                    options={{
                        title: 'テキストから登録',
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.back()}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        ),
                    }}
                />

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="document-text" size={32} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>レシピをテキストで貼り付け</Text>
                        <Text style={styles.subtitle}>
                            Webサイトやメモ帳からレシピの内容をコピー＆ペーストしてください。AIが自動で整理します。
                        </Text>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.label}>レシピの内容</Text>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={styles.inputWrapper}
                            onPress={() => inputRef.current?.focus()}
                        >
                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                value={text}
                                onChangeText={setText}
                                placeholder="材料や作り方のテキストをここに貼り付けてください..."
                                placeholderTextColor={Colors.textLight}
                                multiline
                                textAlignVertical="top"
                                editable={!isLoading}
                            />
                        </TouchableOpacity>
                        <Text style={styles.charCount}>{text.length} 文字</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            (!text.trim() || isLoading) && styles.buttonDisabled
                        ]}
                        onPress={handleAnalyze}
                        disabled={!text.trim() || isLoading}
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
                        <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTextTitle}>コツ</Text>
                            <Text style={styles.infoText}>
                                料理名、分量、材料、手順が含まれていると、より正確に解析されます。
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
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
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
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
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    input: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 12,
        minHeight: 300, // 高さを確実に確保
    },
    charCount: {
        fontSize: 11,
        color: Colors.textLight,
        textAlign: 'right',
        marginTop: 4,
        marginRight: 4,
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
        marginTop: 32,
        padding: 16,
        backgroundColor: Colors.primaryBg,
        borderRadius: 12,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTextTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
});
