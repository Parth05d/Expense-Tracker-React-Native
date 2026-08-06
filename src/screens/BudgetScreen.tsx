import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Target, AlertTriangle } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { BudgetCard } from '../components/budget/BudgetCard';
import { EditBudgetModal } from '../components/budget/EditBudgetModal';
import { Budget, Category } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import { getCurrentYearMonth } from '../utils/dateHelpers';

interface BudgetScreenProps {
  onPressProfile: () => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onPressProfile }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const categories = useExpenseStore((state) => state.categories);
  const budgets = useExpenseStore((state) => state.budgets);
  const getCategorySpend = useExpenseStore((state) => state.getCategorySpend);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currentMonth = getCurrentYearMonth();

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute Total Monthly Budget & Spend
  const { totalBudget, totalSpend, isOverBudget, overallPercent } = useMemo(() => {
    let budgetSum = 0;
    let spendSum = 0;

    expenseCategories.forEach((cat) => {
      const b = budgets.find((item) => item.categoryId === cat.id && item.month === currentMonth);
      if (b) {
        budgetSum += b.amount;
      }
      spendSum += getCategorySpend(cat.id, currentMonth);
    });

    const isOver = spendSum > budgetSum && budgetSum > 0;
    const pct = budgetSum > 0 ? Math.min(100, Math.round((spendSum / budgetSum) * 100)) : 0;

    return {
      totalBudget: budgetSum,
      totalSpend: spendSum,
      isOverBudget: isOver,
      overallPercent: pct,
    };
  }, [expenseCategories, budgets, currentMonth, getCategorySpend]);

  const handleOpenEdit = (budget: Budget, category: Category) => {
    setSelectedBudget(budget);
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleOpenNewBudget = (category: Category) => {
    const existing = budgets.find((b) => b.categoryId === category.id && b.month === currentMonth);
    setSelectedBudget(existing || null);
    setSelectedCategory(category);
    setModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header
        title="Monthly Budgets"
        subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        onPressProfile={onPressProfile}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Budget Summary Hero Card */}
        <Card variant="highlight" style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                Total Allocated Budget
              </Text>
              <Text style={[styles.summaryTotal, { color: theme.text }]}>
                {formatCurrency(totalBudget, currency, { hideDecimals: true })}
              </Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                Total Spent
              </Text>
              <Text
                style={[
                  styles.summarySpend,
                  { color: isOverBudget ? theme.destructive : theme.text },
                ]}
              >
                {formatCurrency(totalSpend, currency, { hideDecimals: true })}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarWrapper}>
            <ProgressBar progress={overallPercent} isOverBudget={isOverBudget} height={9} />
          </View>

          <View style={styles.summaryFooter}>
            <Text style={[styles.pctText, { color: isOverBudget ? theme.destructive : theme.primary }]}>
              {overallPercent}% used
            </Text>
            <Text style={[styles.remainingText, { color: theme.textMuted }]}>
              {isOverBudget
                ? `Exceeded by ${formatCurrency(totalSpend - totalBudget, currency, { hideDecimals: true })}`
                : `${formatCurrency(Math.max(0, totalBudget - totalSpend), currency, { hideDecimals: true })} remaining`}
            </Text>
          </View>
        </Card>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Category Limits
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
            Tap any category to adjust limit
          </Text>
        </View>

        {/* Category Budget Cards */}
        <View style={styles.categoryList}>
          {expenseCategories.map((cat) => {
            const budget = budgets.find(
              (b) => b.categoryId === cat.id && b.month === currentMonth
            ) || {
              id: `temp-${cat.id}`,
              categoryId: cat.id,
              month: currentMonth,
              amount: 0,
              rollover: false,
            };

            const spent = getCategorySpend(cat.id, currentMonth);

            return (
              <BudgetCard
                key={cat.id}
                budget={budget}
                category={cat}
                spent={spent}
                onPressEdit={handleOpenEdit}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Edit Budget Modal */}
      <EditBudgetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        budget={selectedBudget}
        category={selectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryTotal: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summarySpend: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarWrapper: {
    marginVertical: 2,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: {
    fontSize: 13,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  categoryList: {
    gap: Spacing.md,
  },
});
