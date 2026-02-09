import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types/recipe';

interface RecipeCardProps {
    recipe: Recipe;
    onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Image source={{ uri: recipe.image }} style={styles.image} />
            <View style={styles.content}>
                <View style={styles.topContent}>
                    <Text style={styles.title} numberOfLines={2}>
                        {recipe.title}
                    </Text>
                    <View style={styles.tags}>
                        {recipe.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.info} />
                        <Text style={[styles.metaText, { color: Colors.info }]}>
                            {recipe.metadata.estimatedTime}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={14} color={Colors.primary} />
                        <Text style={[styles.metaText, { color: Colors.primary }]}>
                            {recipe.metadata.calories}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
        flexDirection: 'row',
        height: 128,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 12,
    },
    image: {
        width: '33%',
        height: '100%',
    },
    content: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    topContent: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
        lineHeight: 22,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tag: {
        backgroundColor: Colors.borderLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: 8,
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
