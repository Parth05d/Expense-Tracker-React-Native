import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Header } from '../components/common/Header';
import { HeroCardsCarousel } from '../components/home/HeroCardsCarousel';
import { QuickActionBar } from '../components/home/QuickActionBar';
import { SalaryScheduleModal } from '../components/salary/SalaryScheduleModal';
import { AIInsightsCard } from '../components/analytics/AIInsightsCard';
import { IncomeDistributionCard } from '../components/budget/IncomeDistributionCard';
import { IncomeAllocationModal } from '../components/budget/IncomeAllocationModal';
import { CategoryQuickBreakdown } from '../components/home/CategoryQuickBreakdown';
import { RecentTransactionsFeed } from '../components/home/RecentTransactionsFeed';
import { SharedOwedSummaryCard } from '../components/home/SharedOwedSummaryCard';
import { RemindersWidget } from '../components/reminders/RemindersWidget';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';
import { Transaction } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../constants/theme';
import { Activity, Sparkles } from 'lucide-react-native';

interface HomeScreenProps {
  onPressProfile: () => void;
  onPressSeeAllTransactions: () => void;
  onPressSeeAllBudgets: () => void;
  onPressSeeAllGroups?: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPressProfile,
  onPressSeeAllTransactions,
  onPressSeeAllBudgets,
  onPressSeeAllGroups,
  onSelectTransaction,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [refreshing, setRefreshing] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'insights'>('activity');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const userId = useExpenseStore.getState().userId;
    await useExpenseStore.getState().processSyncQueue();
    if (userId) {
      await useExpenseStore.getState().fetchInitialData(userId);
    }
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Background Ambient Mesh Orbs */}
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

      <Header onPressProfile={onPressProfile} />

      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Unified 3-Slide Hero Carousel (Guilt-Free + Payday Countdown + Allocation) */}
        <HeroCardsCarousel
          onPressConfigureAllocation={() => setShowAllocationModal(true)}
          onPressConfigureSalary={() => setShowSalaryModal(true)}
        />

        {/* 1-Tap Quick Action Pills */}
        <QuickActionBar
          onPressSalarySchedule={() => setShowSalaryModal(true)}
          onPressAllocation={() => setShowAllocationModal(true)}
          onPressAIInsights={() => setActiveTab('insights')}
        />

        {/* Segmented Control Switcher for Activity vs Financial Health */}
        <View style={styles.segmentContainer}>
          <View style={[styles.segmentedControl, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('activity')}
              style={[
                styles.segmentBtn,
                activeTab === 'activity' && [styles.segmentBtnActive, { backgroundColor: theme.surface, ...ShadowPresets.subtle }],
              ]}
            >
              <Activity size={14} color={activeTab === 'activity' ? theme.primary : theme.textMuted} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'activity' ? theme.text : theme.textMuted },
                ]}
              >
                Daily Activity
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('insights')}
              style={[
                styles.segmentBtn,
                activeTab === 'insights' && [styles.segmentBtnActive, { backgroundColor: theme.surface, ...ShadowPresets.subtle }],
              ]}
            >
              <Sparkles size={14} color={activeTab === 'insights' ? '#8B5CF6' : theme.textMuted} />
              <Text
                style={[
                  styles.segmentText,
                  { color: activeTab === 'insights' ? theme.text : theme.textMuted },
                ]}
              >
                AI Insights & Health
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TAB 1: DAILY ACTIVITY (Reminders & Dues + Transactions Feed + Quick Category Breakdown + Owed Balances) */}
        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            {/* Custom Reminders & Dues Widget */}
            <RemindersWidget />

            {/* Shared & Family Split Expenses Owed Balance Summary Card */}
            <SharedOwedSummaryCard onPressSeeAllGroups={onPressSeeAllGroups} />

            {/* Quick Category Breakdown */}
            <CategoryQuickBreakdown onPressSeeAll={onPressSeeAllBudgets} />

            {/* Recent Transactions List */}
            <RecentTransactionsFeed
              onPressTransaction={onSelectTransaction}
              onPressSeeAll={onPressSeeAllTransactions}
              limit={5}
            />
          </View>
        )}

        {/* TAB 2: AI INSIGHTS & FINANCIAL HEALTH */}
        {activeTab === 'insights' && (
          <View style={styles.tabContent}>
            {/* AI Spending Intelligence Card */}
            <AIInsightsCard />

            {/* Income % Distribution Card */}
            <IncomeDistributionCard onPressConfigure={() => setShowAllocationModal(true)} />
          </View>
        )}
      </CustomRefreshControl>

      {/* Income Allocation Modal */}
      <IncomeAllocationModal
        visible={showAllocationModal}
        onClose={() => setShowAllocationModal(false)}
      />

      {/* Salary & Payday Schedule Modal */}
      <SalaryScheduleModal
        visible={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
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
    paddingBottom: 28,
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
  segmentContainer: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
  },
  segmentBtnActive: {
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabContent: {
    gap: Spacing.sm,
  },
});
