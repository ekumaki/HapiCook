// HapiCook カラーテーマ
// オレンジベースの料理アプリに最適な暖かい配色

export const Colors = {
  // Primary - オレンジ系
  primary: '#F97316',      // オレンジ 500
  primaryLight: '#FDBA74',  // オレンジ 300
  primaryDark: '#EA580C',   // オレンジ 600
  primaryBg: '#FFF7ED',     // オレンジ 50

  // Accent
  accent: '#10B981',        // エメラルド (Cooking Mode)

  // Neutral
  text: '#1F2937',          // グレー 800
  textSecondary: '#6B7280', // グレー 500
  textLight: '#9CA3AF',     // グレー 400

  background: '#F9FAFB',    // グレー 50
  surface: '#FFFFFF',
  border: '#E5E7EB',        // グレー 200
  borderLight: '#F3F4F6',   // グレー 100

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Dark theme
  dark: {
    background: '#111827',  // グレー 900
    surface: '#1F2937',     // グレー 800
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',      // グレー 700
  },
};

// テーマ用エクスポート (Expo tabs テンプレート互換)
const tintColorLight = Colors.primary;
const tintColorDark = Colors.primaryLight;

export default {
  light: {
    text: Colors.text,
    background: Colors.background,
    tint: tintColorLight,
    tabIconDefault: Colors.textLight,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Colors.dark.text,
    background: Colors.dark.background,
    tint: tintColorDark,
    tabIconDefault: Colors.dark.textSecondary,
    tabIconSelected: tintColorDark,
  },
};
