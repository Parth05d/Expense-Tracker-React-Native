import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../components/common/Header';
import { TransactionFilters, FilterType } from '../components/transactions/TransactionFilters';
import { TransactionRow } from '../components/transactions/TransactionRow';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';
import { Transaction } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing } from '../constants/theme';
import { groupTransactionsByDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/currency';

interface TransactionsScreenProps {
  onSelectTransaction: (tx: Transaction) => void;
  onPressProfile: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onSelectTransaction,
  onPressProfile,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const transactions = useExpenseStore((state) => state.transactions);
  const categories = useExpenseStore((state) => state.categories);
  const deleteTransaction = useExpenseStore((state) => state.deleteTransaction);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storeUserId = useExpenseStore.getState().userId;
    await useExpenseStore.getState().processSyncQueue();
    if (storeUserId) {
      await useExpenseStore.getState().fetchInitialData(storeUserId);
    }
    setRefreshing(false);
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(query);
        const categoryMatch = categories
          .find((c) => c.id === tx.categoryId)
          ?.name.toLowerCase()
          .includes(query);
        if (!noteMatch && !categoryMatch) return false;
      }

      // 2. Type Filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategoryId && tx.categoryId !== selectedCategoryId) {
        return false;
      }

      return true;
    });
  }, [transactions, categories, searchQuery, selectedType, selectedCategoryId]);

  // Group filtered transactions by date
  const groupedSections = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Compute total for filtered view
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => {
      let amount = tx.amount;
      if (tx.groupId && tx.splitType !== 'none' && userId) {
        const txSplits = splits.filter(s => s.transactionId === tx.id);
        if (txSplits.length > 0) {
          const mySplit = txSplits.find(s => s.userId === userId);
          amount = mySplit ? mySplit.amount : 0;
        }
      }
      return tx.type === 'income' ? sum + amount : sum - amount;
    }, 0);
  }, [filteredTransactions, splits, userId]);

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

      <Header title="All Transactions" subtitle="Activity & History" onPressProfile={onPressProfile} />

      {/* Filters & Search */}
      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={[styles.summaryCount, { color: theme.textMuted }]}>
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
        </Text>
        <Text
          style={[
            styles.summaryTotal,
            { color: filteredTotal >= 0 ? theme.primary : theme.text },
          ]}
        >
          {filteredTotal >= 0 ? '+' : ''}{formatCurrency(filteredTotal, currency)}
        </Text>
      </View>

      {/* Date-Grouped Transaction List */}
      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
      >
        {groupedSections.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.cardGlass, borderColor: theme.glassHighlightTop }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Transactions Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Try adjusting your search query or filter selections.
            </Text>
          </View>
        ) : (
          groupedSections.map((section) => (
            <View key={section.isoDate} style={styles.section}>
              <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
                {section.dateLabel}
              </Text>
              <View style={styles.sectionList}>
                {section.transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onPress={onSelectTransaction}
                    onDelete={deleteTransaction}
                    showActions={true}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </CustomRefreshControl>
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
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionList: {
    gap: Spacing.sm,
  },
  emptyContainer: {
    marginTop: Spacing.xxl,
    padding: Spacing.xxl,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
