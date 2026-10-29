import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart, Sliders, ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2 } from 'lucide-react-native';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { getCurrentYearMonth } from '../../utils/dateHelpers';

interface IncomeDistributionCardProps {
  onPressConfigure: () => void;
}

export const IncomeDistributionCard: React.FC<IncomeDistributionCardProps> = ({
  onPressConfigure,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const settings = useExpenseStore((state) => state.settings);
  const categories = useExpenseStore((state) => state.categories);
  const transactions = useExpenseStore((state) => state.transactions);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currentMonth = getCurrentYearMonth();

  // Compute effective monthly income: Actual credited income for month or target from Salary Schedule
  const actualIncome = useMemo(() => {
    const credited = transactions
      .filter((tx) => tx.type === 'income' && tx.date.startsWith(currentMonth))
      .reduce((sum, tx) => sum + tx.amount, 0);
    return credited > 0 ? credited : (settings.monthlyIncomeTarget || settings.monthlyIncome || 50000);
  }, [transactions, currentMonth, settings.monthlyIncomeTarget, settings.monthlyIncome]);

  const monthlyIncome = actualIncome;
  const allocations = settings.incomeAllocations || {};

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute Income Distribution Metrics
  const { totalAllocatedAmount, totalAllocatedPercent, totalSpent, categoryBreakdowns } = useMemo(() => {
    let allocatedSum = 0;
    let allocatedPctSum = 0;
    let spentSum = 0;

    const monthTxs = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(currentMonth)
    );

    const breakdowns = expenseCategories.map((cat) => {
      const pct = allocations[cat.id] || 0;
      const targetAmount = Math.round((monthlyIncome * pct) / 100);
      allocatedSum += targetAmount;
      allocatedPctSum += pct;

      const spentAmount = monthTxs
        .filter((t) => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);

      spentSum += spentAmount;
      const remainingAmount = targetAmount - spentAmount;
      const progressPct = targetAmount > 0 ? Math.min(100, Math.round((spentAmount / targetAmount) * 100)) : 0;

      return {
        category: cat,
        targetPercent: pct,
        targetAmount,
        spentAmount,
        remainingAmount,
        progressPct,
      };
    });

    return {
      totalAllocatedAmount: allocatedSum,
      totalAllocatedPercent: allocatedPctSum,
      totalSpent: spentSum,
      categoryBreakdowns: breakdowns,
    };
  }, [categories, allocations, monthlyIncome, transactions, currentMonth]);

  const totalRemainingIncome = monthlyIncome - totalSpent;

  return (
    <Card variant="glass" style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: theme.primaryDim }]}>
            <Wallet size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Income & Allocation Breakdown</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Monthly Budget Dashboard
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressConfigure}
          style={[styles.configureBtn, { backgroundColor: theme.primary, ...ShadowPresets.glowPrimary }]}
        >
          <Sliders size={14} color="#FFFFFF" />
          <Text style={styles.configureBtnText}>Set %</Text>
        </TouchableOpacity>
      </View>

      {/* 4-Stat Summary Dashboard Grid */}
      <View style={styles.dashboardGrid}>
        {/* Box 1: Total Income */}
        <View style={[styles.statBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Income</Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {formatCurrency(monthlyIncome, currency, { hideDecimals: true })}
          </Text>
        </View>

        {/* Box 2: Total Allocated */}
        <View style={[styles.statBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Allocated ({totalAllocatedPercent}%)</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatCurrency(totalAllocatedAmount, currency, { hideDecimals: true })}
          </Text>
        </View>

        {/* Box 3: Total Spent */}
        <View style={[styles.statBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Spent</Text>
          <Text style={[styles.statValue, { color: totalSpent > totalAllocatedAmount ? theme.destructive : theme.text }]}>
            {formatCurrency(totalSpent, currency, { hideDecimals: true })}
          </Text>
        </View>

        {/* Box 4: Income Remaining */}
        <View style={[styles.statBox, { backgroundColor: theme.primaryDim, borderColor: theme.primary }]}>
          <Text style={[styles.statLabel, { color: theme.primary }]}>Total Remaining</Text>
          <Text style={[styles.statValue, { color: totalRemainingIncome >= 0 ? theme.primary : theme.destructive }]}>
            {formatCurrency(totalRemainingIncome, currency, { hideDecimals: true })}
          </Text>
        </View>
      </View>

      {/* Category Allocation & Spend Breakdown Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableColHeader, { flex: 1.2, color: theme.textMuted }]}>Category</Text>
          <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right', color: theme.textMuted }]}>Allocated</Text>
          <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right', color: theme.textMuted }]}>Spent</Text>
          <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'right', color: theme.textMuted }]}>Left</Text>
        </View>

        {categoryBreakdowns.map((item) => {
          const isOver = item.remainingAmount < 0;
          return (
            <View key={item.category.id} style={styles.tableRowContainer}>
              <View style={styles.tableRow}>
                {/* Category Icon & Name */}
                <View style={[styles.catCol, { flex: 1.2 }]}>
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{item.category.icon}</Text>
                  <Text style={[styles.catNameText, { color: theme.text }]} numberOfLines={1}>
                    {item.category.name}
                  </Text>
                </View>

                {/* Target Allocated */}
                <Text style={[styles.catValText, { flex: 0.8, textAlign: 'right', color: theme.textMuted }]}>
                  {formatCurrency(item.targetAmount, currency, { hideDecimals: true })} ({item.targetPercent}%)
                </Text>

                {/* Spent Amount */}
                <Text style={[styles.catValText, { flex: 0.8, textAlign: 'right', color: theme.text }]}>
                  {formatCurrency(item.spentAmount, currency, { hideDecimals: true })}
                </Text>

                {/* Remaining Left */}
                <Text
                  style={[
                    styles.catValText,
                    {
                      flex: 0.8,
                      textAlign: 'right',
                      fontWeight: '700',
                      color: isOver ? theme.destructive : theme.primary,
                    },
                  ]}
                >
                  {isOver ? '-' : ''}{formatCurrency(Math.abs(item.remainingAmount), currency, { hideDecimals: true })}
                </Text>
              </View>

              {/* Progress Bar for Category */}
              {item.targetAmount > 0 && (
                <View style={styles.catProgressWrapper}>
                  <ProgressBar progress={item.progressPct} isOverBudget={isOver} height={4} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  configureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  configureBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  tableContainer: {
    gap: 8,
    paddingTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRowContainer: {
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catValText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catProgressWrapper: {
    marginTop: 1,
  },
});
