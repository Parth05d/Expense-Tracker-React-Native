import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Category, TransactionType } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';

export type FilterType = 'all' | 'expense' | 'income';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: FilterType;
  onSelectType: (type: FilterType) => void;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onSelectType,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const categories = useExpenseStore((state) => state.categories);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const typeOptions: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'expense', label: 'Expenses' },
    { id: 'income', label: 'Income' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.secondary,
            borderColor: theme.border,
          },
        ]}
      >
        <Search size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search transactions, notes..."
          placeholderTextColor={theme.textDim}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearBtn}>
            <X size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Toggle Chips */}
      <View style={styles.typeChipsRow}>
        {typeOptions.map((opt) => {
          const isSelected = selectedType === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.75}
              onPress={() => onSelectType(opt.id)}
              style={[
                styles.typeChip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.secondary,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: isSelected ? '#FFFFFF' : theme.textMuted },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category Scroll Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onSelectCategory(null)}
          style={[
            styles.catChip,
            {
              backgroundColor: selectedCategoryId === null ? theme.primaryDim : theme.secondary,
              borderColor: selectedCategoryId === null ? theme.primary : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.catChipText,
              { color: selectedCategoryId === null ? theme.primary : theme.textMuted },
            ]}
          >
            All Categories
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => onSelectCategory(isSelected ? null : cat.id)}
              style={[
                styles.catChip,
                {
                  backgroundColor: isSelected ? `${cat.color}25` : theme.secondary,
                  borderColor: isSelected ? cat.color : theme.border,
                },
              ]}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text
                style={[
                  styles.catChipText,
                  { color: isSelected ? theme.text : theme.textMuted },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  catEmoji: {
    fontSize: 14,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
