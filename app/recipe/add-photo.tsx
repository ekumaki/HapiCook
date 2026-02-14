import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { extractRecipeFromImage } from '@/services/geminiService';

type SourceMode = 'photo' | 'camera';

export default function AddPhotoScreen() {
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const router = useRouter();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLaunched, setHasLaunched] = useState(false);

    const sourceMode: SourceMode = mode === 'camera' ? 'camera' : 'photo';

    // 画面表示時に自動でピッカー/カメラを起動
    useEffect(() => {
        if (!hasLaunched) {
            setHasLaunched(true);
            launchPicker();
        }
    }, [hasLaunched]);

    const launchPicker = async () => {
        if (sourceMode === 'camera') {
            await launchCamera();
        } else {
            await launchLibrary();
        }
    };

    const launchCamera = async () => {
        // カメラ権限のリクエスト
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                '権限が必要です',
                'カメラにアクセスするには、設定からカメラの権限を許可してください。'
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) {
            // キャンセルされた場合は戻る
            if (!imageUri) {
                router.back();
            }
            return;
        }

        if (result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const launchLibrary = async () => {
        // ライブラリ権限のリクエスト
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                '権限が必要です',
                '写真ライブラリにアクセスするには、設定から写真の権限を許可してください。'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) {
            // キャンセルされた場合は戻る
            if (!imageUri) {
                router.back();
            }
            return;
        }

        if (result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    /**
     * 画像をBase64に変換する
     */
    const convertImageToBase64 = async (uri: string): Promise<{ base64: string; mimeType: string }> => {
        // Web環境の場合
        if (Platform.OS === 'web') {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    const reader = new FileReader();
                    reader.onloadend = function () {
                        const dataUrl = reader.result as string;
                        // "data:image/jpeg;base64,..." の形式からBase64部分を抽出
                        const base64Match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                        if (base64Match) {
                            resolve({
                                base64: base64Match[2],
                                mimeType: base64Match[1],
                            });
                        } else {
                            reject(new Error('画像のBase64変換に失敗しました'));
                        }
                    };
                    reader.readAsDataURL(xhr.response);
                };
                xhr.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                xhr.open('GET', uri);
                xhr.responseType = 'blob';
                xhr.send();
            });
        }

        // ネイティブ環境の場合（expo-file-system使用）
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
        });

        // MIME typeを推定
        const extension = uri.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg';
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';

        return { base64, mimeType };
    };

    const handleAnalyze = async () => {
        if (!imageUri) return;

        setIsLoading(true);

        try {
            const { base64, mimeType } = await convertImageToBase64(imageUri);
            const recipeData = await extractRecipeFromImage(base64, mimeType);

            // 解析結果を持ってプレビュー画面へ遷移
            router.push({
                pathname: '/recipe/preview',
                params: { data: JSON.stringify(recipeData) },
            });
        } catch (error: any) {
            if (Platform.OS === 'web') {
                alert(error.message || '画像の解析中にエラーが発生しました');
            } else {
                Alert.alert('解析失敗', error.message || '画像の解析中にエラーが発生しました');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: sourceMode === 'camera' ? 'カメラで撮影' : '写真から登録',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={sourceMode === 'camera' ? 'camera' : 'image'}
                            size={32}
                            color={Colors.primary}
                        />
                    </View>
                    <Text style={styles.title}>
                        {sourceMode === 'camera'
                            ? 'レシピをカメラで撮影'
                            : '写真からレシピを読み取り'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {sourceMode === 'camera'
                            ? 'レシピ本やメモを撮影して、AIが自動でレシピを読み取ります。'
                            : 'スクリーンショットや料理の写真からAIがレシピを解析します。'}
                    </Text>
                </View>

                {/* Image Preview */}
                {imageUri ? (
                    <View style={styles.imageSection}>
                        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                        <View style={styles.imageActions}>
                            <TouchableOpacity
                                style={styles.retakeButton}
                                onPress={launchPicker}
                                disabled={isLoading}
                            >
                                <Ionicons
                                    name={sourceMode === 'camera' ? 'camera-outline' : 'image-outline'}
                                    size={18}
                                    color={Colors.primary}
                                />
                                <Text style={styles.retakeText}>
                                    {sourceMode === 'camera' ? '撮り直す' : '別の写真を選ぶ'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.placeholderSection}>
                        <TouchableOpacity style={styles.placeholderButton} onPress={launchPicker}>
                            <Ionicons
                                name={sourceMode === 'camera' ? 'camera-outline' : 'image-outline'}
                                size={48}
                                color={Colors.textLight}
                            />
                            <Text style={styles.placeholderText}>
                                {sourceMode === 'camera'
                                    ? 'タップしてカメラを起動'
                                    : 'タップして写真を選択'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Analyze Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        (!imageUri || isLoading) && styles.buttonDisabled,
                    ]}
                    onPress={handleAnalyze}
                    disabled={!imageUri || isLoading}
                >
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#fff" />
                            <Text style={styles.buttonText}>AIが画像を解析中...</Text>
                        </View>
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={20} color="#fff" />
                            <Text style={styles.buttonText}>AIでレシピを解析する</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTextTitle}>コツ</Text>
                        <Text style={styles.infoText}>
                            {sourceMode === 'camera'
                                ? '文字がはっきり読める距離で、明るい場所で撮影するとより正確に解析されます。'
                                : 'レシピが全体的に写っている画像を選ぶと、より正確に解析されます。料理の完成写真からは一般的なレシピを生成します。'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
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
        marginBottom: 24,
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
    imageSection: {
        marginBottom: 24,
    },
    image: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        backgroundColor: Colors.borderLight,
    },
    imageActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.primaryBg,
        borderRadius: 20,
        gap: 6,
    },
    retakeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    placeholderSection: {
        marginBottom: 24,
    },
    placeholderButton: {
        width: '100%',
        height: 240,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.textLight,
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
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
