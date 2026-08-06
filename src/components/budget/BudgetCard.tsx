import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, AlertCircle, CheckCircle } from 'lucide-react-native';
import { Budget, Category } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { CategoryBadge } from '../common/CategoryBadge';
import { ProgressBar } from '../common/ProgressBar';

interface BudgetCardProps {
  budget: Budget;
  category: Category;
  spent: number;
  onPressEdit: (budget: Budget, category: Category) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  category,
  spent,
  onPressEdit,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const limit = budget.amount;
  const isOver = spent > limit;
  const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const remaining = Math.max(0, limit - spent);

  const formattedSpent = formatCurrency(spent, currency, { hideDecimals: true });
  const formattedLimit = formatCurrency(limit, currency, { hideDecimals: true });
  const formattedRemaining = formatCurrency(remaining, currency, { hideDecimals: true });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPressEdit(budget, category)}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isOver ? theme.destructiveDim : theme.border,
        },
      ]}
    >
      {/* Top row: Category Icon, Name, and Edit trigger */}
      <View style={styles.topRow}>
        <View style={styles.left}>
          <CategoryBadge icon={category.icon} color={category.color} size="md" />
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {category.name}
            </Text>
            <Text style={[styles.statusSubtext, { color: isOver ? theme.destructive : theme.textMuted }]}>
              {isOver ? (
                `Over by ${formatCurrency(spent - limit, currency, { hideDecimals: true })}`
              ) : (
                `${formattedRemaining} remaining`
              )}
            </Text>
          </View>
        </View>

        <View style={styles.rightSpend}>
          <Text style={[styles.spentText, { color: isOver ? theme.destructive : theme.text }]}>
            {formattedSpent}
          </Text>
          <Text style={[styles.limitText, { color: theme.textMuted }]}>
            of {formattedLimit}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressWrapper}>
        <ProgressBar progress={percent} isOverBudget={isOver} height={7} />
      </View>

      {/* Bottom info row: percentage & badge */}
      <View style={styles.bottomRow}>
        <View style={styles.percentBadge}>
          {isOver ? (
            <AlertCircle size={13} color={theme.destructive} />
          ) : percent >= 80 ? (
            <AlertCircle size={13} color={theme.accentAmber} />
          ) : (
            <CheckCircle size={13} color={theme.primary} />
          )}
          <Text
            style={[
              styles.percentText,
              {
                color: isOver
                  ? theme.destructive
                  : percent >= 80
                  ? theme.accentAmber
                  : theme.primary,
              },
            ]}
          >
            {percent}% used
          </Text>
        </View>

        <View style={styles.editBtn}>
          <Edit2 size={13} color={theme.textDim} />
          <Text style={[styles.editText, { color: theme.textDim }]}>Edit Limit</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSpend: {
    alignItems: 'flex-end',
  },
  spentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  limitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressWrapper: {
    marginVertical: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
