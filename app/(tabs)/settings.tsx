import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
            title: 'その他',
            items: [
                { icon: 'help-circle-outline', label: 'ヘルプ' },
                { icon: 'document-text-outline', label: '利用規約' },
                { icon: 'shield-checkmark-outline', label: 'プライバシーポリシー' },
                { icon: 'information-circle-outline', label: 'バージョン', value: '1.0.0' },
            ],
        },
    ];

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
                                        {item.value && (
                                            <Text style={styles.settingValue}>{item.value}</Text>
                                        )}
                                        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
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
});
