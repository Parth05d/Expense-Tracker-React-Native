import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../components/common/Header';
import { GuiltFreeHeroCard } from '../components/home/GuiltFreeHeroCard';
import { CategoryQuickBreakdown } from '../components/home/CategoryQuickBreakdown';
import { RecentTransactionsFeed } from '../components/home/RecentTransactionsFeed';
import { Transaction } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme } from '../constants/theme';

interface HomeScreenProps {
  onPressProfile: () => void;
  onPressSeeAllTransactions: () => void;
  onPressSeeAllBudgets: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPressProfile,
  onPressSeeAllTransactions,
  onPressSeeAllBudgets,
  onSelectTransaction,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header onPressProfile={onPressProfile} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Guilt-Free Spending Card */}
        <GuiltFreeHeroCard />

        {/* Quick Category Breakdown */}
        <CategoryQuickBreakdown onPressSeeAll={onPressSeeAllBudgets} />

        {/* Recent Transactions List */}
        <RecentTransactionsFeed
          onPressTransaction={onSelectTransaction}
          onPressSeeAll={onPressSeeAllTransactions}
          limit={5}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
