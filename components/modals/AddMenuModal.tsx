import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface AddMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectOption: (option: 'photo' | 'camera' | 'link' | 'manual') => void;
}

const menuItems = [
    {
        id: 'photo' as const,
        icon: 'image-outline' as const,
        label: '写真から選択',
        desc: 'スクショやライブラリから'
    },
    {
        id: 'camera' as const,
        icon: 'camera-outline' as const,
        label: 'カメラで撮影',
        desc: '本やメモをスキャン'
    },
    {
        id: 'link' as const,
        icon: 'link-outline' as const,
        label: 'Webリンク',
        desc: 'URLから自動読み込み'
    },
    {
        id: 'manual' as const,
        icon: 'create-outline' as const,
        label: '直接入力',
        desc: '空のレシピを作成'
    },
];

export function AddMenuModal({ visible, onClose, onSelectOption }: AddMenuModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <Text style={styles.headerTitle}>レシピを追加</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.menuList}>
                                {menuItems.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.menuItem}
                                        onPress={() => onSelectOption(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={item.icon} size={22} color={Colors.primary} />
                                        </View>
                                        <View style={styles.menuText}>
                                            <Text style={styles.menuLabel}>{item.label}</Text>
                                            <Text style={styles.menuDesc}>{item.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    menuList: {
        gap: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.background,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    menuDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
});
