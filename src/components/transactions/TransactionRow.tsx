import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { Transaction } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { formatTimeWithTimezone } from '../../utils/dateHelpers';
import { CategoryBadge } from '../common/CategoryBadge';

interface TransactionRowProps {
  transaction: Transaction;
  onPress: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onPress,
  onDelete,
  showActions = false,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const categories = useExpenseStore((state) => state.categories);
  const accounts = useExpenseStore((state) => state.accounts);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);

  const theme = isDarkMode ? DarkTheme : LightTheme;

  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const isIncome = transaction.type === 'income';
  let displayAmount = transaction.amount;
  let isSplit = false;

  if (transaction.groupId && transaction.splitType !== 'none' && userId) {
    const txSplits = splits.filter(s => s.transactionId === transaction.id);
    if (txSplits.length > 0) {
      const mySplit = txSplits.find(s => s.userId === userId);
      displayAmount = mySplit ? mySplit.amount : 0;
      isSplit = true;
    }
  }

  const formattedAmount = `${isIncome ? '+' : '-'}${formatCurrency(displayAmount, currency)}`;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(transaction)}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.left}>
        <CategoryBadge
          icon={category?.icon || (isIncome ? '💰' : '📦')}
          color={category?.color || (isIncome ? theme.primary : theme.textMuted)}
          size="md"
        />

        <View style={styles.details}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {transaction.note || category?.name || (isIncome ? 'Income' : 'Expense')}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              {category?.name || 'General'}
            </Text>
            {account && (
              <>
                <Text style={[styles.dot, { color: theme.textDim }]}>•</Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textDim }]}>
                  {account.name}
                </Text>
              </>
            )}
            {transaction.createdAt && (
              <>
                <Text style={[styles.dot, { color: theme.textDim }]}>•</Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textDim }]}>
                  {formatTimeWithTimezone(transaction.createdAt)}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
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

        {showActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => onPress(transaction)}
              style={[styles.miniBtn, { backgroundColor: theme.secondary }]}
            >
              <Edit2 size={14} color={theme.text} />
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(transaction.id)}
                style={[styles.miniBtn, { backgroundColor: theme.destructiveDim }]}
              >
                <Trash2 size={14} color={theme.destructive} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  details: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 10,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  miniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
