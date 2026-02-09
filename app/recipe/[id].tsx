import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { SAMPLE_RECIPES } from '@/data/sampleRecipes';

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [cookingMode, setCookingMode] = useState(false);

    // Cooking Mode時は画面を常時オンに
    useKeepAwake();

    const recipe = SAMPLE_RECIPES.find((r) => r.id === id);

    if (!recipe) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>レシピが見つかりません</Text>
            </SafeAreaView>
        );
    }

    const bgColor = cookingMode ? Colors.dark.background : Colors.surface;
    const textColor = cookingMode ? Colors.dark.text : Colors.text;
    const secondaryColor = cookingMode ? Colors.dark.textSecondary : Colors.textSecondary;

    return (
        <>
            <Stack.Screen
                options={{
                    title: recipe.title,
                    headerStyle: {
                        backgroundColor: cookingMode ? Colors.dark.surface : Colors.surface,
                    },
                    headerTintColor: cookingMode ? Colors.dark.text : Colors.text,
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => router.push(`/recipe/edit/${id}`)}
                                style={styles.headerButton}
                            >
                                <Ionicons name="pencil" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setCookingMode(!cookingMode)}
                                style={[
                                    styles.cookingModeButton,
                                    cookingMode && styles.cookingModeButtonActive,
                                ]}
                            >
                                <Ionicons
                                    name={cookingMode ? 'sunny' : 'moon'}
                                    size={14}
                                    color={cookingMode ? '#fff' : Colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.cookingModeText,
                                        cookingMode && styles.cookingModeTextActive,
                                    ]}
                                >
                                    {cookingMode ? 'COOKING' : 'OFF'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />
            <StatusBar barStyle={cookingMode ? 'light-content' : 'dark-content'} />

            <View style={[styles.container, { backgroundColor: bgColor }]}>
                <ScrollView style={styles.content}>
                    {/* Hero Image */}
                    {!cookingMode && (
                        <Image source={{ uri: recipe.image }} style={styles.heroImage} />
                    )}

                    {/* Ingredients Section */}
                    <View style={[styles.section, cookingMode && styles.sectionDark]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                                材料
                            </Text>
                            <Text style={[styles.servings, { color: secondaryColor }]}>
                                {recipe.servings}
                            </Text>
                        </View>
                        <View style={styles.ingredientsList}>
                            {recipe.ingredients.map((ing, index) => (
                                <View key={index} style={styles.ingredientItem}>
                                    <Text style={[styles.ingredientName, { color: textColor }]}>
                                        {ing.name}
                                    </Text>
                                    <View style={styles.ingredientDots} />
                                    <Text style={[styles.ingredientQuantity, { color: textColor }]}>
                                        {ing.quantity}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Metadata */}
                        <View style={styles.metaRow}>
                            <View style={[styles.metaBadge, cookingMode && styles.metaBadgeDark]}>
                                <Text style={styles.metaEmoji}>🕒</Text>
                                <Text style={[styles.metaValue, { color: textColor }]}>
                                    {recipe.metadata.estimatedTime}
                                </Text>
                            </View>
                            <View style={[styles.metaBadge, cookingMode && styles.metaBadgeDark]}>
                                <Text style={styles.metaEmoji}>🔥</Text>
                                <Text style={[styles.metaValue, { color: textColor }]}>
                                    {recipe.metadata.calories}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Steps Section */}
                    <View style={[styles.section, styles.stepsSection, cookingMode && styles.sectionDark]}>
                        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                            作り方
                        </Text>
                        <View style={styles.stepsList}>
                            {recipe.steps.map((step, index) => (
                                <View key={index} style={styles.stepItem}>
                                    <View
                                        style={[
                                            styles.stepNumber,
                                            cookingMode && styles.stepNumberDark,
                                        ]}
                                    >
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.stepText, { color: textColor }]}>
                                        {step}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <View style={[styles.footerLine, { backgroundColor: secondaryColor }]} />
                            <Text style={[styles.footerText, { color: secondaryColor }]}>
                                美味しくできますように！
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerButton: {
        padding: 8,
    },
    cookingModeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.borderLight,
        gap: 4,
    },
    cookingModeButtonActive: {
        backgroundColor: Colors.accent,
    },
    cookingModeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    cookingModeTextActive: {
        color: '#fff',
    },
    heroImage: {
        width: '100%',
        height: 240,
    },
    section: {
        padding: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    sectionDark: {
        backgroundColor: Colors.dark.surface,
        borderBottomColor: Colors.dark.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    servings: {
        fontSize: 14,
        marginLeft: 12,
    },
    ingredientsList: {
        gap: 12,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    ingredientName: {
        fontSize: 15,
        fontWeight: '500',
    },
    ingredientDots: {
        flex: 1,
        height: 1,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        borderStyle: 'dashed',
        marginHorizontal: 8,
    },
    ingredientQuantity: {
        fontSize: 15,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: 6,
    },
    metaBadgeDark: {
        borderColor: Colors.dark.border,
        backgroundColor: Colors.dark.background,
    },
    metaEmoji: {
        fontSize: 14,
    },
    metaValue: {
        fontSize: 12,
    },
    stepsSection: {
        flex: 1,
        borderBottomWidth: 0,
    },
    stepsList: {
        gap: 20,
    },
    stepItem: {
        flexDirection: 'row',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    stepNumberDark: {
        backgroundColor: Colors.primary,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 24,
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    footerLine: {
        width: 60,
        height: 3,
        borderRadius: 2,
        marginBottom: 12,
    },
    footerText: {
        fontSize: 13,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
