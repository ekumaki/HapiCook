import { auth, db } from '@/services/firebaseConfig';
import { deleteRecipeImage, isLocalImageUri, uploadRecipeImage } from '@/services/storageService';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { SAMPLE_RECIPES } from '@/data/sampleRecipes';
import { Recipe } from '@/types/recipe';

interface RecipeContextType {
    recipes: Recipe[];
    addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Recipe;
    updateRecipe: (recipe: Recipe) => void;
    deleteRecipe: (id: string) => void;
    getRecipeById: (id: string) => Recipe | undefined;
    importRecipes: (recipes: Omit<Recipe, 'id' | 'userId' | 'createdAt'>[]) => Promise<number>;
    isLoading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Firestore のドキュメントを Recipe 型に変換するヘルパー関数
function docToRecipe(docId: string, data: any): Recipe {
    return {
        id: docId,
        title: data.title || '',
        image: data.image || '',
        tags: data.tags || [],
        servings: data.servings || '',
        metadata: data.metadata || { estimatedTime: '', calories: '' },
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        userId: data.userId || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
    };
}

// Recipe 型を Firestore 保存用のオブジェクトに変換するヘルパー関数
function recipeToDoc(recipe: Omit<Recipe, 'id'>, userId: string) {
    return {
        title: recipe.title,
        image: recipe.image || '',
        tags: recipe.tags || [],
        servings: recipe.servings || '',
        metadata: recipe.metadata || { estimatedTime: '', calories: '' },
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        userId: userId,
        createdAt: recipe.createdAt ? Timestamp.fromDate(new Date(recipe.createdAt)) : Timestamp.now(),
    };
}

export function RecipeProvider({ children }: { children: React.ReactNode }) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // アプリ起動時に匿名ログインを実行
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log('Firebase: 匿名ログイン成功 (UID):', currentUser.uid);
                setUser(currentUser);
            } else {
                console.log('Firebase: ログインしていません。匿名ログインを開始します...');
                signInAnonymously(auth).catch((error) => {
                    console.error('Firebase 匿名ログインエラー:', error);
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // ユーザーがログインしたら Firestore からレシピをリアルタイム取得
    useEffect(() => {
        if (!user) return;

        const recipesRef = collection(db, 'recipes');
        const q = query(
            recipesRef,
            where('userId', '==', user.uid)
        );

        // onSnapshot: Firestoreのデータが変わるたびにリアルタイムで更新される
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const loadedRecipes = snapshot.docs
                .map((doc) => docToRecipe(doc.id, doc.data()))
                // クライアント側で新しい順にソート（複合インデックス不要）
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });

            // 初回起動時（レシピが0件の場合）にサンプルデータを投入
            if (loadedRecipes.length === 0 && isLoading) {
                console.log('Firebase: 初回起動を検出。サンプルレシピを投入します...');
                await loadSampleRecipes(user.uid);
                // サンプル投入後は onSnapshot が再度呼ばれるので、ここでは何もしない
            } else {
                setRecipes((prev) => {
                    // データが変わっていない場合は再レンダリングを防止するため、以前の参照を返す
                    if (prev.length === loadedRecipes.length && JSON.stringify(prev) === JSON.stringify(loadedRecipes)) {
                        return prev;
                    }
                    return loadedRecipes;
                });
                setIsLoading(false);
            }
        }, (error) => {
            console.error('Firestore リアルタイム取得エラー:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // サンプルレシピを Firestore に投入する関数
    const loadSampleRecipes = async (userId: string) => {
        try {
            // 初回投入済みフラグを確認（二重投入を防ぐ）
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data()?.sampleLoaded) {
                console.log('Firebase: サンプルデータは既に投入済みです。');
                setIsLoading(false);
                return;
            }

            const recipesRef = collection(db, 'recipes');
            for (const sample of SAMPLE_RECIPES) {
                const { id, ...recipeWithoutId } = sample;
                await addDoc(recipesRef, recipeToDoc(recipeWithoutId, userId));
            }

            // 投入済みフラグを保存
            await setDoc(userDocRef, { sampleLoaded: true }, { merge: true });
            console.log('Firebase: サンプルレシピの投入が完了しました。');
        } catch (error) {
            console.error('サンプルレシピ投入エラー:', error);
            setIsLoading(false);
        }
    };

    // レシピを追加（Firestoreに書き込み + 画像アップロード）
    const addRecipe = useCallback((recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe => {
        const tempId = `temp_${Date.now()}`;
        const newRecipe: Recipe = {
            ...recipeData,
            id: tempId,
            createdAt: new Date(),
        };

        // まずローカルに即反映（UX向上のため）
        setRecipes((prev) => [newRecipe, ...prev]);

        // Firestoreに非同期で書き込み + 画像アップロード
        if (user) {
            const recipesRef = collection(db, 'recipes');
            addDoc(recipesRef, recipeToDoc(newRecipe, user.uid))
                .then(async (docRef) => {
                    // FirestoreのドキュメントIDでローカルのIDを更新
                    setRecipes((prev) =>
                        prev.map((r) => (r.id === tempId ? { ...r, id: docRef.id } : r))
                    );
                    console.log('Firebase: レシピを保存しました:', docRef.id);

                    // ローカル画像がある場合、Storageにアップロード
                    if (newRecipe.image && isLocalImageUri(newRecipe.image)) {
                        try {
                            const downloadUrl = await uploadRecipeImage(
                                newRecipe.image,
                                user.uid,
                                docRef.id
                            );
                            // FirestoreのimageフィールドをStorageのURLで更新
                            const recipeDocRef = doc(db, 'recipes', docRef.id);
                            await updateDoc(recipeDocRef, { image: downloadUrl });
                            // ローカルstateも更新
                            setRecipes((prev) =>
                                prev.map((r) =>
                                    r.id === docRef.id ? { ...r, image: downloadUrl } : r
                                )
                            );
                            console.log('Firebase: 画像URLを更新しました');
                        } catch (imgError) {
                            console.error('画像アップロードエラー（レシピは保存済み）:', imgError);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Firebase レシピ保存エラー:', error);
                });
        }

        return newRecipe;
    }, [user]);

    // レシピを更新（Firestoreを更新 + 画像アップロード）
    const updateRecipe = useCallback((updatedRecipe: Recipe) => {
        // ローカルに即反映
        setRecipes((prev) =>
            prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );

        // Firestoreを非同期で更新
        if (user && !updatedRecipe.id.startsWith('temp_')) {
            const recipeDocRef = doc(db, 'recipes', updatedRecipe.id);
            const { id, ...updateData } = updatedRecipe;

            // ローカル画像がある場合、先にStorageにアップロード
            const saveToFirestore = async () => {
                let imageUrl = updatedRecipe.image;

                if (updatedRecipe.image && isLocalImageUri(updatedRecipe.image)) {
                    try {
                        imageUrl = await uploadRecipeImage(
                            updatedRecipe.image,
                            user.uid,
                            updatedRecipe.id
                        );
                        // ローカルstateも更新
                        setRecipes((prev) =>
                            prev.map((r) =>
                                r.id === updatedRecipe.id ? { ...r, image: imageUrl } : r
                            )
                        );
                    } catch (imgError) {
                        console.error('画像アップロードエラー:', imgError);
                    }
                }

                await updateDoc(recipeDocRef, recipeToDoc(
                    { ...updateData, image: imageUrl },
                    user.uid
                ));
                console.log('Firebase: レシピを更新しました:', updatedRecipe.id);
            };

            saveToFirestore().catch((error) => {
                console.error('Firebase レシピ更新エラー:', error);
            });
        }
    }, [user]);

    // レシピを削除（Firestoreから削除 + Storage画像も削除）
    const deleteRecipe = useCallback((id: string) => {
        // ローカルから即削除
        setRecipes((prev) => prev.filter((r) => r.id !== id));

        // Firestoreから非同期で削除 + Storageの画像も削除
        if (user && !id.startsWith('temp_')) {
            const recipeDocRef = doc(db, 'recipes', id);
            Promise.all([
                deleteDoc(recipeDocRef),
                deleteRecipeImage(user.uid, id),
            ])
                .then(() => {
                    console.log('Firebase: レシピと画像を削除しました:', id);
                })
                .catch((error) => {
                    console.error('Firebase レシピ削除エラー:', error);
                });
        }
    }, [user]);

    const getRecipeById = useCallback(
        (id: string) => recipes.find((r) => r.id === id),
        [recipes]
    );

    // 複数のレシピを一括インポート（Firestoreに書き込み）
    const importRecipes = useCallback(async (importData: Omit<Recipe, 'id' | 'userId' | 'createdAt'>[]): Promise<number> => {
        if (!user) {
            throw new Error('ユーザーがログインしていません');
        }

        try {
            const recipesRef = collection(db, 'recipes');

            const promises = importData.map(recipeData => {
                const newRecipe = {
                    ...recipeData,
                    createdAt: new Date(),
                };
                return addDoc(recipesRef, recipeToDoc(newRecipe as Omit<Recipe, 'id'>, user.uid));
            });

            await Promise.all(promises);
            console.log(`Firebase: ${promises.length}件のレシピをインポートしました`);

            return promises.length;
        } catch (error) {
            console.error('Firebase レシピインポートエラー:', error);
            throw error;
        }
    }, [user]);

    return (
        <RecipeContext.Provider
            value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeById, importRecipes, isLoading }}
        >
            {children}
        </RecipeContext.Provider>
    );
}

export function useRecipes() {
    const context = useContext(RecipeContext);
    if (!context) {
        throw new Error('useRecipes must be used within a RecipeProvider');
    }
    return context;
}
