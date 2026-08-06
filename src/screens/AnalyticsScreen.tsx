import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { CategoryDonutChart } from '../components/analytics/CategoryDonutChart';
import { CashflowBarChart } from '../components/analytics/CashflowBarChart';
import { EssentialRatioCard } from '../components/analytics/EssentialRatioCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../constants/theme';
import { getCurrentYearMonth } from '../utils/dateHelpers';

interface AnalyticsScreenProps {
  onPressProfile: () => void;
}

type PeriodOption = 'thisMonth' | 'lastMonth' | 'all';

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onPressProfile }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const transactions = useExpenseStore((state) => state.transactions);
  const categories = useExpenseStore((state) => state.categories);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const [period, setPeriod] = useState<PeriodOption>('thisMonth');

  const currentMonthStr = getCurrentYearMonth();
  const [currentYear, currentMonthNum] = currentMonthStr.split('-').map(Number);
  const lastMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
  const lastMonthYear = currentMonthNum === 1 ? currentYear - 1 : currentYear;
  const lastMonthStr = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}`;

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (period === 'thisMonth') {
      return transactions.filter((tx) => tx.date.startsWith(currentMonthStr));
    }
    if (period === 'lastMonth') {
      return transactions.filter((tx) => tx.date.startsWith(lastMonthStr));
    }
    return transactions;
  }, [transactions, period, currentMonthStr, lastMonthStr]);

  // Compute category slices for Donut Chart
  const { slices, totalExpense, totalIncome, essentialSpend, discretionarySpend } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let essential = 0;
    let discretionary = 0;
    const categorySpendMap = new Map<string, number>();

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
        const currentCatSpend = categorySpendMap.get(tx.categoryId) || 0;
        categorySpendMap.set(tx.categoryId, currentCatSpend + tx.amount);

        const cat = categories.find((c) => c.id === tx.categoryId);
        if (cat?.isEssential) {
          essential += tx.amount;
        } else {
          discretionary += tx.amount;
        }
      }
    });

    const categorySlices = categories
      .filter((c) => c.type === 'expense')
      .map((c) => {
        const amt = categorySpendMap.get(c.id) || 0;
        const pct = expense > 0 ? (amt / expense) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          amount: amt,
          percentage: pct,
        };
      })
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      slices: categorySlices,
      totalExpense: expense,
      totalIncome: income,
      essentialSpend: essential,
      discretionarySpend: discretionary,
    };
  }, [filteredTransactions, categories]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header title="Spending Insights" subtitle="Analytics & Breakdown" onPressProfile={onPressProfile} />

      {/* Period Filter Tabs */}
      <View style={styles.periodTabsWrapper}>
        <View style={[styles.periodTabsContainer, { backgroundColor: theme.secondary }]}>
          <TouchableOpacity
            onPress={() => setPeriod('thisMonth')}
            style={[styles.periodTab, period === 'thisMonth' && { backgroundColor: theme.surface }]}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: period === 'thisMonth' ? theme.text : theme.textMuted },
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('lastMonth')}
            style={[styles.periodTab, period === 'lastMonth' && { backgroundColor: theme.surface }]}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: period === 'lastMonth' ? theme.text : theme.textMuted },
              ]}
            >
              Last Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod('all')}
            style={[styles.periodTab, period === 'all' && { backgroundColor: theme.surface }]}
          >
            <Text
              style={[
                styles.periodTabText,
                { color: period === 'all' ? theme.text : theme.textMuted },
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Donut Chart Card */}
        <Card variant="glass" style={styles.sectionCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Category Spending</Text>
          <CategoryDonutChart slices={slices} totalAmount={totalExpense} />
        </Card>

        {/* Needs vs Wants Breakdown */}
        <EssentialRatioCard
          essentialSpend={essentialSpend}
          discretionarySpend={discretionarySpend}
        />

        {/* Cashflow Bar Chart Card */}
        <Card variant="glass" style={styles.sectionCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Cashflow Overview</Text>
          <CashflowBarChart totalIncome={totalIncome} totalExpense={totalExpense} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  periodTabsWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  periodTabsContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.round,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  sectionCard: {
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
