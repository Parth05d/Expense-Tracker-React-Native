import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Download } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { CategoryDonutChart } from '../components/analytics/CategoryDonutChart';
import { CashflowBarChart } from '../components/analytics/CashflowBarChart';
import { EssentialRatioCard } from '../components/analytics/EssentialRatioCard';
import { AIInsightsCard } from '../components/analytics/AIInsightsCard';
import { ExportReportModal } from '../components/analytics/ExportReportModal';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';
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
  const [refreshing, setRefreshing] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storeUserId = useExpenseStore.getState().userId;
    if (storeUserId) {
      await useExpenseStore.getState().fetchInitialData(storeUserId);
    }
    await useExpenseStore.getState().processSyncQueue();
    setRefreshing(false);
  }, []);

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
      const txAmt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += txAmt;
      } else {
        expense += txAmt;
        const currentCatSpend = categorySpendMap.get(tx.categoryId) || 0;
        categorySpendMap.set(tx.categoryId, currentCatSpend + txAmt);

        const cat = categories.find((c) => c.id === tx.categoryId);
        if (cat?.isEssential) {
          essential += txAmt;
        } else {
          discretionary += txAmt;
        }
      }
    });

    const categorySlices = categories
      .filter((c) => c.type === 'expense')
      .map((c) => {
        const amount = categorySpendMap.get(c.id) || 0;
        const percentage = expense > 0 ? Math.round((amount / expense) * 100) : 0;
        return {
          id: c.id,
          categoryId: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          amount,
          percentage,
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
      {/* Ambient Depth Orbs */}
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbLeftCenter,
          {
            backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.14)' : 'rgba(124, 58, 237, 0.08)',
          },
        ]}
      />

      <Header title="Spending Insights" subtitle="Analytics & Breakdown" onPressProfile={onPressProfile} />

      {/* Period Filter Tabs & Export Trigger */}
      <View style={styles.periodTabsWrapper}>
        <View
          style={[
            styles.periodTabsContainer,
            { backgroundColor: theme.cardGlass, borderColor: theme.glassHighlightTop },
          ]}
        >
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

        <TouchableOpacity
          onPress={() => setExportModalVisible(true)}
          style={[styles.exportBtn, { backgroundColor: theme.primaryDim }]}
        >
          <Download size={15} color={theme.primary} />
          <Text style={[styles.exportBtnText, { color: theme.primary }]}>Export</Text>
        </TouchableOpacity>
      </View>

      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Pace & Velocity Insights Card */}
        <View style={{ marginHorizontal: -Spacing.lg }}>
          <AIInsightsCard />
        </View>

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
      </CustomRefreshControl>

      {/* Export Report Sheet Modal */}
      <ExportReportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
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
  ambientOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    pointerEvents: 'none',
  },
  ambientOrbLeftCenter: {
    position: 'absolute',
    top: 300,
    left: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    pointerEvents: 'none',
  },
  periodTabsWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  periodTabsContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BorderRadius.round,
    padding: 3,
    borderWidth: 1,
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
