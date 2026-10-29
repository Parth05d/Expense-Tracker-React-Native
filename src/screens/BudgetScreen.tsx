import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Sliders, PieChart, ShieldAlert, Sparkles, Filter } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { BudgetCard } from '../components/budget/BudgetCard';
import { EditBudgetModal } from '../components/budget/EditBudgetModal';
import { CreateCategoryModal } from '../components/categories/CreateCategoryModal';
import { IncomeAllocationModal } from '../components/budget/IncomeAllocationModal';
import { IncomeDistributionCard } from '../components/budget/IncomeDistributionCard';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';
import { Budget, Category } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import { getCurrentYearMonth } from '../utils/dateHelpers';

interface BudgetScreenProps {
  onPressProfile: () => void;
}

type FilterTab = 'all' | 'over' | 'essential';

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onPressProfile }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const categories = useExpenseStore((state) => state.categories);
  const budgets = useExpenseStore((state) => state.budgets);
  const getCategorySpend = useExpenseStore((state) => state.getCategorySpend);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currentMonth = getCurrentYearMonth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storeUserId = useExpenseStore.getState().userId;
    await useExpenseStore.getState().processSyncQueue();
    if (storeUserId) {
      await useExpenseStore.getState().fetchInitialData(storeUserId);
    }
    setRefreshing(false);
  }, []);

  // Modals State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [createCategoryVisible, setCreateCategoryVisible] = useState(false);
  const [incomeAllocationVisible, setIncomeAllocationVisible] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute Total Monthly Budget & Spend
  const { totalBudget, totalSpend, isOverBudget, overallPercent } = useMemo(() => {
    let budgetSum = 0;
    let spendSum = 0;

    expenseCategories.forEach((cat) => {
      const b = budgets.find((item) => item.categoryId === cat.id && item.month === currentMonth);
      if (b) {
        budgetSum += Number(b.amount) || 0;
      }
      spendSum += Number(getCategorySpend(cat.id, currentMonth)) || 0;
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

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return expenseCategories.filter((cat) => {
      const budget = budgets.find((b) => b.categoryId === cat.id && b.month === currentMonth);
      const limit = budget?.amount || 0;
      const spent = getCategorySpend(cat.id, currentMonth);
      const isOver = spent > limit && limit > 0;

      if (activeFilter === 'over') return isOver;
      if (activeFilter === 'essential') return cat.isEssential;
      return true;
    });
  }, [expenseCategories, budgets, currentMonth, getCategorySpend, activeFilter]);

  const handleOpenEdit = (budget: Budget, category: Category) => {
    setSelectedBudget(budget);
    setSelectedCategory(category);
    setModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Ambient Mesh Orbs */}
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbLeftCenter,
          {
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)',
          },
        ]}
      />

      <Header
        title="Monthly Budgets"
        subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        onPressProfile={onPressProfile}
      />

      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Glassmorphic Total Budget Summary Hero Card */}
        <Card variant="glass" style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
                Total Monthly Budget
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
            <ProgressBar progress={overallPercent} isOverBudget={isOverBudget} height={8} />
          </View>

          <View style={styles.summaryFooter}>
            <Text style={[styles.pctText, { color: isOverBudget ? theme.destructive : theme.primary }]}>
              {overallPercent}% Used
            </Text>
            <Text style={[styles.remainingText, { color: theme.textMuted }]}>
              {isOverBudget
                ? `Exceeded by ${formatCurrency(Math.abs(totalSpend - totalBudget), currency, { hideDecimals: true })}`
                : `${formatCurrency(Math.max(0, totalBudget - totalSpend), currency, { hideDecimals: true })} remaining`}
            </Text>
          </View>
        </Card>

        {/* Income Distribution Dashboard Card */}
        <View style={styles.distributionWrapper}>
          <IncomeDistributionCard onPressConfigure={() => setIncomeAllocationVisible(true)} />
        </View>

        {/* Category Limits Header & Controls */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Category Limits
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
              Tap any category card to edit limit
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primaryDim }]}
              onPress={() => setIncomeAllocationVisible(true)}
            >
              <Sliders size={14} color={theme.primary} />
              <Text style={[styles.actionBtnText, { color: theme.primary }]}>% Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.secondary }]}
              onPress={() => setCreateCategoryVisible(true)}
            >
              <Plus size={14} color={theme.text} />
              <Text style={[styles.actionBtnText, { color: theme.text }]}>Category</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === 'all' ? theme.primary : theme.secondary,
                borderColor: activeFilter === 'all' ? theme.primary : theme.border,
              },
            ]}
          >
            <Text style={[styles.filterText, { color: activeFilter === 'all' ? '#FFF' : theme.textMuted }]}>
              All ({expenseCategories.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('over')}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === 'over' ? theme.destructiveDim : theme.secondary,
                borderColor: activeFilter === 'over' ? theme.destructive : theme.border,
              },
            ]}
          >
            <ShieldAlert size={13} color={activeFilter === 'over' ? theme.destructive : theme.textMuted} />
            <Text style={[styles.filterText, { color: activeFilter === 'over' ? theme.destructive : theme.textMuted }]}>
              Over Budget
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('essential')}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === 'essential' ? theme.primaryDim : theme.secondary,
                borderColor: activeFilter === 'essential' ? theme.primary : theme.border,
              },
            ]}
          >
            <Sparkles size={13} color={activeFilter === 'essential' ? theme.primary : theme.textMuted} />
            <Text style={[styles.filterText, { color: activeFilter === 'essential' ? theme.primary : theme.textMuted }]}>
              Essential Needs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Budget Cards */}
        <View style={styles.categoryList}>
          {filteredCategories.map((cat) => {
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
      </CustomRefreshControl>

      {/* Edit Budget Modal */}
      <EditBudgetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        budget={selectedBudget}
        category={selectedCategory}
      />

      {/* Create Custom Category Modal */}
      <CreateCategoryModal
        visible={createCategoryVisible}
        onClose={() => setCreateCategoryVisible(false)}
        defaultType="expense"
      />

      {/* Income % Allocation Modal */}
      <IncomeAllocationModal
        visible={incomeAllocationVisible}
        onClose={() => setIncomeAllocationVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    pointerEvents: 'none',
  },
  ambientOrbLeftCenter: {
    position: 'absolute',
    top: 280,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    pointerEvents: 'none',
  },
  summaryCard: {
    marginBottom: Spacing.md,
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
  distributionWrapper: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryList: {
    gap: Spacing.md,
  },
});
