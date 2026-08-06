import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../components/common/Header';
import { TransactionFilters, FilterType } from '../components/transactions/TransactionFilters';
import { TransactionRow } from '../components/transactions/TransactionRow';
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

  const theme = isDarkMode ? DarkTheme : LightTheme;

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
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);
  }, [filteredTransactions]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
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

      {/* Summary of matching records */}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {groupedSections.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
