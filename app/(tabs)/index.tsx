import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

import { AddMenuModal } from '@/components/modals/AddMenuModal';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Colors } from '@/constants/Colors';
import { useRecipes } from '@/contexts/RecipeContext';
import { Recipe } from '@/types/recipe';

const FILTERS = [
  'すべて',
  '時短（15分以内）',
  '主菜',
  '副菜',
  'ごはん・麺・パン',
  'デザート',
  '作り置き',
  'お弁当',
];

export default function RecipeListScreen() {
  const router = useRouter();
  const { recipes } = useRecipes();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const { width } = useWindowDimensions();
  const isWide = width > 425;

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: recipe.id },
    });
  };

  const handleAddOption = (option: 'photo' | 'camera' | 'link' | 'text' | 'manual') => {
    setShowAddMenu(false);
    switch (option) {
      case 'manual':
        router.push('/recipe/new');
        break;
      case 'link':
        router.push('/recipe/add-link');
        break;
      case 'text':
        router.push('/recipe/add-text');
        break;
      case 'photo':
      case 'camera':
        router.push({
          pathname: '/recipe/add-photo',
          params: { mode: option },
        });
        break;
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    // テキスト検索
    const matchesSearch = !searchQuery || (() => {
      const query = searchQuery.toLowerCase();
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query))
      );
    })();

    // タグフィルタ
    const activeTag = FILTERS[activeFilter];
    const matchesTag = activeTag === 'すべて' || recipe.tags.some((tag) => tag === activeTag);

    return matchesSearch && matchesTag;
  });

  const numColumns = isWide ? 2 : 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="料理名、食材で検索..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tags */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === index && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(index)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === index && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Recipe List */}
      <FlatList
        key={`recipe-list-${numColumns}`}
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.gridItem : styles.listItem}>
            <RecipeCard recipe={item} onPress={() => handleRecipePress(item)} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>レシピがありません</Text>
          </View>
        }
      />

      {/* FAB (Add Button) */}
      <View style={styles.fabContainer}>
        <View style={styles.fabLabelContainer}>
          <Text style={styles.fabLabel}>レシピ追加</Text>
        </View>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddMenu(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add Menu Modal */}
      <AddMenuModal
        visible={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onSelectOption={handleAddOption}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
    marginBottom: 12,
  },
  listItem: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    alignItems: 'center',
  },
  fabLabelContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
