import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { ChatMessage, finalizeRecipeFromChat, sendRecipeChatMessage } from '@/services/aiService';

// 画面表示用のメッセージ（最初の挨拶はAPIの履歴には含めない）
interface UiMessage extends ChatMessage {
    isGreeting?: boolean;
}

const GREETING: UiMessage = {
    role: 'model',
    isGreeting: true,
    text: 'こんにちは！ハピクックAIです 🍳\nどんな料理を作りたいですか？\n\n「冷蔵庫に豚肉とキャベツがある」「15分でできる夕食」「さっぱりしたものが食べたい」など、気軽に相談してください。',
};

export default function AiChatScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<UiMessage[]>([GREETING]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // API に渡す履歴（挨拶を除く）
    const apiHistory = (msgs: UiMessage[]): ChatMessage[] =>
        msgs.filter((m) => !m.isGreeting).map(({ role, text }) => ({ role, text }));

    // AIの返答が1つ以上あれば「レシピにまとめる」を出す
    const canFinalize = messages.some((m) => m.role === 'model' && !m.isGreeting);

    const scrollToEnd = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending || isFinalizing) return;

        const history = apiHistory(messages);
        const userMessage: UiMessage = { role: 'user', text };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsSending(true);
        scrollToEnd();

        try {
            const reply = await sendRecipeChatMessage(history, text);
            setMessages((prev) => [...prev, { role: 'model', text: reply }]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { role: 'model', text: `⚠️ ${error.message || 'エラーが発生しました。もう一度お試しください。'}` },
            ]);
        } finally {
            setIsSending(false);
            scrollToEnd();
        }
    };

    const handleFinalize = async () => {
        if (isSending || isFinalizing) return;
        setIsFinalizing(true);

        try {
            const recipeData = await finalizeRecipeFromChat(apiHistory(messages));
            router.push({
                pathname: '/recipe/preview',
                params: { data: JSON.stringify(recipeData) },
            });
        } catch (error: any) {
            if (Platform.OS === 'web') {
                window.alert(error.message || 'レシピのまとめに失敗しました');
            } else {
                Alert.alert('エラー', error.message || 'レシピのまとめに失敗しました');
            }
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Stack.Screen
                options={{
                    title: 'AIと相談してレシピ作成',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* メッセージ一覧 */}
            <ScrollView
                ref={scrollRef}
                style={styles.messageList}
                contentContainerStyle={styles.messageListContent}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((message, index) => (
                    <View
                        key={index}
                        style={[
                            styles.messageRow,
                            message.role === 'user' ? styles.messageRowUser : styles.messageRowAi,
                        ]}
                    >
                        {message.role === 'model' && (
                            <View style={styles.aiAvatar}>
                                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                            </View>
                        )}
                        <View
                            style={[
                                styles.bubble,
                                message.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.bubbleText,
                                    message.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAi,
                                ]}
                            >
                                {message.text}
                            </Text>
                        </View>
                    </View>
                ))}

                {isSending && (
                    <View style={[styles.messageRow, styles.messageRowAi]}>
                        <View style={styles.aiAvatar}>
                            <Ionicons name="sparkles" size={14} color={Colors.primary} />
                        </View>
                        <View style={[styles.bubble, styles.bubbleAi]}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* レシピにまとめるボタン */}
            {canFinalize && (
                <View style={styles.finalizeContainer}>
                    <TouchableOpacity
                        style={[styles.finalizeButton, isFinalizing && styles.buttonDisabled]}
                        onPress={handleFinalize}
                        disabled={isFinalizing || isSending}
                    >
                        {isFinalizing ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.finalizeButtonText}>まとめています...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="restaurant" size={18} color="#fff" />
                                <Text style={styles.finalizeButtonText}>このレシピにまとめる</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* 入力欄 */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="食材や気分を入力..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    editable={!isFinalizing}
                    onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!input.trim() || isSending || isFinalizing) && styles.buttonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!input.trim() || isSending || isFinalizing}
                >
                    <Ionicons name="arrow-up" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 16,
        paddingBottom: 24,
        gap: 12,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageRowAi: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    bubbleUser: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleAi: {
        backgroundColor: Colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 22,
    },
    bubbleTextUser: {
        color: '#fff',
    },
    bubbleTextAi: {
        color: Colors.text,
    },
    finalizeContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    finalizeButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.success,
        height: 48,
        borderRadius: 24,
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    finalizeButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text,
        maxHeight: 120,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
