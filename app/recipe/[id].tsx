import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getRecipeById } = useRecipes();
    const { width } = useWindowDimensions();
    const isWide = width > 425;

    // 画面を常時オンに
    useKeepAwake();

    const recipe = getRecipeById(id);

    if (!recipe) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>レシピが見つかりません</Text>
            </SafeAreaView>
        );
    }

    const bgColor = Colors.surface;
    const textColor = Colors.text;
    const secondaryColor = Colors.textSecondary;

    // Shared: Section header with 材料 title, servings, time, calories
    const renderSectionHeader = () => (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                材料
            </Text>
            <View style={styles.headerMeta}>
                <View style={styles.metaBadge}>
                    <Text style={styles.metaEmoji}>🍽️</Text>
                    <Text style={[styles.metaValue, { color: textColor }]}>
                        {recipe.servings || '- 人前'}
                    </Text>
                </View>
                <View style={styles.metaBadge}>
                    <Text style={styles.metaEmoji}>🕒</Text>
                    <Text style={[styles.metaValue, { color: textColor }]}>
                        {recipe.metadata.estimatedTime?.trim() ? recipe.metadata.estimatedTime : '- 分'}
                    </Text>
                </View>
                <View style={styles.metaBadge}>
                    <Text style={styles.metaEmoji}>🔥</Text>
                    <Text style={[styles.metaValue, { color: textColor }]}>
                        {recipe.metadata.calories?.trim() ? recipe.metadata.calories : '- kcal'}
                    </Text>
                </View>
            </View>
        </View>
    );

    // Shared: Ingredients list
    const renderIngredients = () => (
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
    );

    // Shared: Steps list
    const renderSteps = () => (
        <View style={styles.stepsList}>
            {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: textColor }]}>
                        {step}
                    </Text>
                </View>
            ))}
        </View>
    );

    // Shared: Footer
    const renderFooter = () => (
        <View style={styles.footer}>
            <View style={[styles.footerLine, { backgroundColor: secondaryColor }]} />
            <Text style={[styles.footerText, { color: secondaryColor }]}>
                美味しくできますように！
            </Text>
        </View>
    );

    return (
        <>
            <Stack.Screen
                options={{
                    title: recipe.title,
                    headerStyle: {
                        backgroundColor: Colors.surface,
                    },
                    headerTintColor: Colors.text,
                    headerRight: () => (
                        <View style={styles.headerRight}>
                            <TouchableOpacity
                                onPress={() => router.push(`/recipe/edit/${id}`)}
                                style={styles.headerButton}
                            >
                                <Ionicons name="pencil" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    ),
                }}
            />
            <StatusBar barStyle="dark-content" />

            <View style={[styles.container, { backgroundColor: bgColor }]}>
                {isWide ? (
                    /* ===== Wide layout: side-by-side, independent scrolling ===== */
                    <View style={styles.splitContainer}>
                        {/* Left column: scrollable independently */}
                        <ScrollView
                            style={styles.splitLeft}
                            contentContainerStyle={styles.splitLeftContent}
                        >
                            {renderSectionHeader()}
                            {renderIngredients()}

                            {/* Photo below ingredients (wide layout) */}
                            <View style={styles.splitImageContainer}>
                                <Image source={{ uri: recipe.image }} style={styles.splitImage} />
                            </View>
                        </ScrollView>

                        {/* Right column: scrollable independently */}
                        <ScrollView
                            style={styles.splitRight}
                            contentContainerStyle={styles.splitRightContent}
                        >
                            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                                作り方
                            </Text>
                            {renderSteps()}
                            {renderFooter()}
                        </ScrollView>
                    </View>
                ) : (
                    /* ===== Mobile layout: single scroll ===== */
                    <ScrollView style={styles.content}>
                        {/* Hero Image (mobile only - shown at top) */}
                        <View style={styles.heroImageContainer}>
                            <Image source={{ uri: recipe.image }} style={styles.heroImage} />
                        </View>

                        {/* Ingredients Section */}
                        <View style={styles.section}>
                            {renderSectionHeader()}
                            {renderIngredients()}
                        </View>

                        {/* Steps Section */}
                        <View style={[styles.section, styles.stepsSection]}>
                            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
                                作り方
                            </Text>
                            {renderSteps()}
                            {renderFooter()}
                        </View>
                    </ScrollView>
                )}
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
    heroImageContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    splitImageContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
    },
    splitImage: {
        width: '100%',
        height: '100%',
    },
    section: {
        padding: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        gap: 4,
    },
    metaEmoji: {
        fontSize: 12,
    },
    metaValue: {
        fontSize: 11,
    },
    stepsSection: {
        flex: 1,
        borderBottomWidth: 0,
    },
    splitContainer: {
        flexDirection: 'row',
        flex: 1,
    },
    splitLeft: {
        flex: 2,
        backgroundColor: Colors.surface,
        borderRightWidth: 1,
        borderRightColor: Colors.borderLight,
    },
    splitLeftContent: {
        padding: 20,
        paddingBottom: 40,
    },
    splitRight: {
        flex: 3,
        backgroundColor: Colors.surface,
    },
    splitRightContent: {
        padding: 20,
        paddingBottom: 40,
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
