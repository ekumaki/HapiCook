import { Colors } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { exportRecipesData, importRecipesData } from '@/services/recipeExportImportService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const settingsSections = [
        {
            title: 'アカウント',
            items: [
                { icon: 'person-outline', label: 'プロフィール', value: 'ゲスト' },
                { icon: 'diamond-outline', label: 'プレミアム会員', value: 'Free' },
            ],
        },
        {
            title: '使用状況',
            items: [
                { icon: 'restaurant-outline', label: '登録レシピ数', value: '3 / 50' },
                { icon: 'sparkles-outline', label: 'AI解析 (今月)', value: '0 / 10' },
            ],
        },
        {
            title: 'アプリ設定',
            items: [
                { icon: 'moon-outline', label: 'ダークモード', value: 'システム設定' },
                { icon: 'notifications-outline', label: '通知', value: 'オン' },
            ],
        },
        {
            title: 'データ管理',
            items: [
                { id: 'export', icon: 'cloud-upload-outline', label: 'レシピをエクスポート' },
                { id: 'import', icon: 'cloud-download-outline', label: 'レシピをインポート' },
            ],
        },
        {
            title: 'その他',
            items: [
                { icon: 'help-circle-outline', label: 'ヘルプ' },
                { icon: 'document-text-outline', label: '利用規約' },
                { icon: 'shield-checkmark-outline', label: 'プライバシーポリシー' },
                { icon: 'information-circle-outline', label: 'バージョン', value: '1.0.0' },
            ],
        },
    ];

    const { recipes, importRecipes } = useRecipes();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleExport = async () => {
        try {
            setIsProcessing(true);
            await exportRecipesData(recipes);
            Alert.alert('エクスポート完了', 'レシピデータをエクスポートしました。');
        } catch (error: any) {
            Alert.alert('エラー', 'エクスポートに失敗しました: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = async () => {
        try {
            setIsProcessing(true);
            const importedData = await importRecipesData();
            if (!importedData) {
                setIsProcessing(false);
                return;
            }

            // Web環境ではAlert.alertのコールバックが正しく動作しないため、window.confirmを使用
            if (Platform.OS === 'web') {
                const confirmed = window.confirm(`${importedData.length}件のレシピをインポートしますか？`);
                if (!confirmed) {
                    setIsProcessing(false);
                    return;
                }
                try {
                    const count = await importRecipes(importedData);
                    window.alert(`${count}件のレシピをインポートしました。`);
                } catch (e: any) {
                    window.alert('保存に失敗しました: ' + e.message);
                } finally {
                    setIsProcessing(false);
                }
            } else {
                Alert.alert(
                    'インポートの確認',
                    `${importedData.length}件のレシピをインポートしますか？`,
                    [
                        { text: 'キャンセル', style: 'cancel', onPress: () => setIsProcessing(false) },
                        {
                            text: 'インポート',
                            onPress: async () => {
                                try {
                                    const count = await importRecipes(importedData);
                                    Alert.alert('インポート完了', `${count}件のレシピをインポートしました。`);
                                } catch (e: any) {
                                    Alert.alert('エラー', '保存に失敗しました: ' + e.message);
                                } finally {
                                    setIsProcessing(false);
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message);
            setIsProcessing(false);
        }
    };

    const handleItemPress = (item: any) => {
        if (item.id === 'export') {
            handleExport();
        } else if (item.id === 'import') {
            handleImport();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {settingsSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionContent}>
                            {section.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={[
                                        styles.settingItem,
                                        itemIndex < section.items.length - 1 && styles.settingItemBorder,
                                    ]}
                                    onPress={() => handleItemPress(item)}
                                    disabled={isProcessing}
                                >
                                    <View style={styles.settingLeft}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={20}
                                            color={Colors.primary}
                                            style={styles.settingIcon}
                                        />
                                        <Text style={styles.settingLabel}>{item.label}</Text>
                                    </View>
                                    <View style={styles.settingRight}>
                                        {'value' in item && item.value && (
                                            <Text style={styles.settingValue}>{item.value as string}</Text>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {isProcessing && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>処理中...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 15,
        color: Colors.text,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingValue: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginRight: 4,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: Colors.text,
        fontWeight: 'bold',
    },
});
