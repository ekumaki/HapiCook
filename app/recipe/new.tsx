import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { Ingredient, Recipe } from '@/types/recipe';

// 空のレシピテンプレート
function createEmptyRecipe(): Omit<Recipe, 'id' | 'createdAt'> {
    return {
        title: '',
        image: '',
        tags: [],
        servings: '',
        metadata: { estimatedTime: '', calories: '' },
        ingredients: [{ name: '', quantity: '' }],
        steps: [''],
    };
}

export default function NewRecipeScreen() {
    const router = useRouter();
    const { addRecipe } = useRecipes();
    const [formData, setFormData] = useState(createEmptyRecipe());

    const handleSave = () => {
        console.log('handleSave called with:', formData);
        if (!formData.title.trim()) {
            Alert.alert('入力エラー', 'レシピタイトルを入力してください');
            return;
        }
        // 空の材料・手順を除外してから保存
        const cleaned = {
            ...formData,
            ingredients: formData.ingredients.filter((ing) => ing.name.trim()),
            steps: formData.steps.filter((s) => s.trim()),
        };
        console.log('Adding recipe:', cleaned);
        const added = addRecipe(cleaned);
        console.log('Added recipe:', added);

        if (Platform.OS === 'web') {
            alert('レシピが追加されました');
            router.back();
        } else {
            Alert.alert('保存完了', 'レシピが追加されました', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
    };

    const handleChangeImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as ImagePicker.MediaType[],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const updateField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        setFormData({ ...formData, [field]: value });
    };

    const updateMetadata = (field: 'estimatedTime' | 'calories', value: string) => {
        setFormData({
            ...formData,
            metadata: { ...formData.metadata, [field]: value },
        });
    };

    const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { name: '', quantity: '' }],
        });
    };

    const removeIngredient = (index: number) => {
        setFormData({
            ...formData,
            ingredients: formData.ingredients.filter((_, i) => i !== index),
        });
    };

    const updateStep = (index: number, value: string) => {
        const newSteps = [...formData.steps];
        newSteps[index] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    const addStep = () => {
        setFormData({ ...formData, steps: [...formData.steps, ''] });
    };

    const removeStep = (index: number) => {
        setFormData({
            ...formData,
            steps: formData.steps.filter((_, i) => i !== index),
        });
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: '新規レシピ',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.headerCancel}>キャンセル</Text>
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSave} style={styles.headerSave}>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text style={styles.headerSaveText}>保存</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Image Section */}
                <TouchableOpacity style={styles.imageSection} onPress={handleChangeImage}>
                    {formData.image ? (
                        <>
                            <Image source={{ uri: formData.image }} style={styles.image} />
                            <View style={styles.imageOverlay}>
                                <Ionicons name="camera" size={24} color="#fff" />
                                <Text style={styles.imageOverlayText}>写真を変更</Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={40} color={Colors.textLight} />
                            <Text style={styles.imagePlaceholderText}>写真を追加</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.label}>レシピタイトル</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.title}
                        onChangeText={(v) => updateField('title', v)}
                        placeholder="タイトルを入力"
                        placeholderTextColor={Colors.textLight}
                    />

                    <View style={styles.row}>
                        <View style={styles.rowItem}>
                            <Text style={styles.label}>
                                <Ionicons name="people-outline" size={12} /> 分量
                            </Text>
                            <TextInput
                                style={styles.inputSmall}
                                value={formData.servings}
                                onChangeText={(v) => updateField('servings', v)}
                                placeholder="2人分"
                                placeholderTextColor={Colors.textLight}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <Text style={styles.label}>
                                <Ionicons name="time-outline" size={12} /> 時間
                            </Text>
                            <TextInput
                                style={styles.inputSmall}
                                value={formData.metadata.estimatedTime}
                                onChangeText={(v) => updateMetadata('estimatedTime', v)}
                                placeholder="15分"
                                placeholderTextColor={Colors.textLight}
                            />
                        </View>
                        <View style={styles.rowItem}>
                            <Text style={styles.label}>
                                <Ionicons name="flame-outline" size={12} /> カロリー
                            </Text>
                            <TextInput
                                style={styles.inputSmall}
                                value={formData.metadata.calories}
                                onChangeText={(v) => updateMetadata('calories', v)}
                                placeholder="350kcal"
                                placeholderTextColor={Colors.textLight}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>タグ (カンマ区切り)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.tags.join(', ')}
                        onChangeText={(v) => updateField('tags', v.split(',').map((t) => t.trim()))}
                        placeholder="豚肉, 時短, 和食"
                        placeholderTextColor={Colors.textLight}
                    />
                </View>

                {/* Ingredients */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>材料</Text>
                        <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                            <Ionicons name="add" size={16} color={Colors.primary} />
                            <Text style={styles.addButtonText}>追加</Text>
                        </TouchableOpacity>
                    </View>
                    {formData.ingredients.map((ing, index) => (
                        <View key={index} style={styles.ingredientRow}>
                            <TextInput
                                style={[styles.ingredientInput, { flex: 2 }]}
                                value={ing.name}
                                onChangeText={(v) => updateIngredient(index, 'name', v)}
                                placeholder="材料名"
                                placeholderTextColor={Colors.textLight}
                            />
                            <TextInput
                                style={[styles.ingredientInput, { flex: 1 }]}
                                value={ing.quantity}
                                onChangeText={(v) => updateIngredient(index, 'quantity', v)}
                                placeholder="分量"
                                placeholderTextColor={Colors.textLight}
                            />
                            <TouchableOpacity
                                onPress={() => removeIngredient(index)}
                                style={styles.deleteButton}
                            >
                                <Ionicons name="trash-outline" size={18} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* Steps */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>作り方</Text>
                        <TouchableOpacity onPress={addStep} style={styles.addButton}>
                            <Ionicons name="add" size={16} color={Colors.primary} />
                            <Text style={styles.addButtonText}>追加</Text>
                        </TouchableOpacity>
                    </View>
                    {formData.steps.map((step, index) => (
                        <View key={index} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <TextInput
                                style={styles.stepInput}
                                value={step}
                                onChangeText={(v) => updateStep(index, v)}
                                placeholder="手順を入力"
                                placeholderTextColor={Colors.textLight}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={() => removeStep(index)}
                                style={styles.deleteButton}
                            >
                                <Ionicons name="trash-outline" size={18} color={Colors.textLight} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        paddingBottom: 40,
    },
    headerCancel: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    headerSave: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    headerSaveText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    imageSection: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.borderLight,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 0.7,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageOverlayText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 4,
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 8,
    },
    section: {
        backgroundColor: Colors.surface,
        padding: 16,
        marginTop: 12,
        borderRadius: 12,
        marginHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: 8,
        fontSize: 16,
        color: Colors.text,
    },
    inputSmall: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: 6,
        fontSize: 14,
        color: Colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    rowItem: {
        flex: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    ingredientInput: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 12,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primaryBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    stepInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    deleteButton: {
        padding: 8,
        marginTop: 4,
    },
});
