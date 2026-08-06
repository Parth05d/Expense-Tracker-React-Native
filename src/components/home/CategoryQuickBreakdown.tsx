import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { CategoryBadge } from '../common/CategoryBadge';

interface CategoryQuickBreakdownProps {
  onPressCategory?: (categoryId: string) => void;
  onPressSeeAll?: () => void;
}

export const CategoryQuickBreakdown: React.FC<CategoryQuickBreakdownProps> = ({
  onPressCategory,
  onPressSeeAll,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const categories = useExpenseStore((state) => state.categories);
  const getCategorySpend = useExpenseStore((state) => state.getCategorySpend);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Quick Breakdown
        </Text>
        {onPressSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onPressSeeAll}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {expenseCategories.map((cat) => {
          const spend = getCategorySpend(cat.id);
          const formattedSpend = formatCurrency(spend, currency, { hideDecimals: true });

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.75}
              onPress={() => onPressCategory && onPressCategory(cat.id)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <CategoryBadge icon={cat.icon} color={cat.color} size="md" />
              <Text numberOfLines={1} style={[styles.categoryName, { color: theme.textMuted }]}>
                {cat.name}
              </Text>
              <Text style={[styles.amountText, { color: theme.text }]}>
                {formattedSpend}
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
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    width: 120,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
