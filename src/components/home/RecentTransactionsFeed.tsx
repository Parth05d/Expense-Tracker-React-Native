import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatReadableDate, formatTimeWithTimezone, sortTransactionsDesc } from '../../utils/dateHelpers';
import { CategoryBadge } from '../common/CategoryBadge';

interface RecentTransactionsFeedProps {
  onPressTransaction: (tx: Transaction) => void;
  onPressSeeAll?: () => void;
  limit?: number;
}

export const RecentTransactionsFeed: React.FC<RecentTransactionsFeedProps> = ({
  onPressTransaction,
  onPressSeeAll,
  limit = 5,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const transactions = useExpenseStore((state) => state.transactions);
  const categories = useExpenseStore((state) => state.categories);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const recentTxList = sortTransactionsDesc(transactions).slice(0, limit);

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Recent Activity
        </Text>
        {onPressSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onPressSeeAll}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>
              See all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transaction Rows */}
      {recentTxList.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            No transactions yet. Tap the + button to add one!
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {recentTxList.map((tx) => {
            const category = categoryMap.get(tx.categoryId);
            const isIncome = tx.type === 'income';
            
            let displayAmount = tx.amount;
            let isSplit = false;

            if (tx.groupId && tx.splitType !== 'none' && userId) {
              const txSplits = splits.filter(s => s.transactionId === tx.id);
              if (txSplits.length > 0) {
                const mySplit = txSplits.find(s => s.userId === userId);
                displayAmount = mySplit ? mySplit.amount : 0;
                isSplit = true;
              }
            }

            const formattedAmount = `${isIncome ? '+' : '-'}${formatCurrency(displayAmount, currency)}`;

            return (
              <TouchableOpacity
                key={tx.id}
                activeOpacity={0.75}
                onPress={() => onPressTransaction(tx)}
                style={[
                  styles.txRow,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.left}>
                  <CategoryBadge
                    icon={category?.icon || (isIncome ? '💰' : '📦')}
                    color={category?.color || theme.primary}
                    size="md"
                  />
                  <View style={styles.info}>
                    <Text numberOfLines={1} style={[styles.txTitle, { color: theme.text }]}>
                      {tx.note || category?.name || (isIncome ? 'Income' : 'Expense')}
                    </Text>
                    <Text style={[styles.txSubtitle, { color: theme.textMuted }]}>
                      {category?.name || 'General'} • {formatReadableDate(tx.date)} {tx.createdAt ? `• ${formatTimeWithTimezone(tx.createdAt)}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? theme.primary : theme.text },
                    ]}
                  >
                    {formattedAmount}
                  </Text>
                  {isSplit && (
                    <Text style={{ fontSize: 10, color: theme.primary, marginTop: 2, fontWeight: '600' }}>
                      Your Share
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: Spacing.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  txSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
