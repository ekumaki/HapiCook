// レシピ関連の型定義

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface RecipeMetadata {
  estimatedTime: string;
  calories: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  tags: string[];
  servings: string;
  metadata: RecipeMetadata;
  ingredients: Ingredient[];
  steps: string[];
  userId?: string;
  createdAt?: Date;
}

// ユーザー関連の型定義
export interface UserUsage {
  recipeCount: number;
  aiParseCountCurrentMonth: number;
  lastResetDate: Date;
}

export interface User {
  uid: string;
  isPremium: boolean;
  subscriptionStatus: 'active' | 'expired' | 'none';
  usage: UserUsage;
}
