import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types/recipe';

interface RecipeCardProps {
    recipe: Recipe;
    onPress: () => void;
}

function formatTime(value: string | undefined): string {
    if (!value || value.trim() === '') return '- 分';
    return value;
}

function formatCalories(value: string | undefined): string {
    if (!value || value.trim() === '') return '- kcal';
    return value;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Left: Photo, 1/3 of card width */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: recipe.image }} style={styles.image} />
            </View>
            {/* Right: Recipe info */}
            <View style={styles.content}>
                <View style={styles.topContent}>
                    <Text style={styles.title} numberOfLines={2}>
                        {recipe.title}
                    </Text>
                    {/* Tags: up to 2 lines, hidden overflow */}
                    <View style={styles.tags}>
                        {(recipe.tags || [])
                            .filter(t => t.trim() !== '')
                            .map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText} numberOfLines={1}>#{tag}</Text>
                                </View>
                            ))}
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.info} />
                        <Text style={[styles.metaText, { color: Colors.info }]}>
                            {formatTime(recipe.metadata.estimatedTime)}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={14} color={Colors.primary} />
                        <Text style={[styles.metaText, { color: Colors.primary }]}>
                            {formatCalories(recipe.metadata.calories)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const CARD_HEIGHT = 128;

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'row',
        height: CARD_HEIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        width: '33%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 10,
        justifyContent: 'space-between',
    },
    topContent: {
        flex: 1,
        overflow: 'hidden',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
        lineHeight: 19,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        overflow: 'hidden',
        maxHeight: 38, // 約2行分（タグの高さ＋ギャップ）に制限して3行目以降を隠す
    },
    tag: {
        backgroundColor: Colors.borderLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        flexShrink: 0,
    },
    tagText: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: 6,
        marginTop: 4,
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '500',
    },
});
