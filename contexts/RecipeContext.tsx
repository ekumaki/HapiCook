import React, { createContext, useCallback, useContext, useState } from 'react';

import { SAMPLE_RECIPES } from '@/data/sampleRecipes';
import { Recipe } from '@/types/recipe';

interface RecipeContextType {
    recipes: Recipe[];
    addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Recipe;
    updateRecipe: (recipe: Recipe) => void;
    deleteRecipe: (id: string) => void;
    getRecipeById: (id: string) => Recipe | undefined;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
    const [recipes, setRecipes] = useState<Recipe[]>(SAMPLE_RECIPES);

    const addRecipe = useCallback((recipeData: Omit<Recipe, 'id' | 'createdAt'>): Recipe => {
        const newRecipe: Recipe = {
            ...recipeData,
            id: `recipe_${Date.now()}`,
            createdAt: new Date(),
        };
        setRecipes((prev) => [newRecipe, ...prev]);
        return newRecipe;
    }, []);

    const updateRecipe = useCallback((updatedRecipe: Recipe) => {
        setRecipes((prev) =>
            prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r))
        );
    }, []);

    const deleteRecipe = useCallback((id: string) => {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const getRecipeById = useCallback(
        (id: string) => recipes.find((r) => r.id === id),
        [recipes]
    );

    return (
        <RecipeContext.Provider
            value={{ recipes, addRecipe, updateRecipe, deleteRecipe, getRecipeById }}
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
