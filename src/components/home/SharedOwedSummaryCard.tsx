import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';
import { Card } from '../common/Card';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { calculateGroupBalances } from '../../utils/splitCalc';

interface SharedOwedSummaryCardProps {
  onPressSeeAllGroups?: () => void;
}

export const SharedOwedSummaryCard: React.FC<SharedOwedSummaryCardProps> = ({
  onPressSeeAllGroups,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const groups = useExpenseStore((state) => state.groups);
  const groupMembers = useExpenseStore((state) => state.groupMembers);
  const transactions = useExpenseStore((state) => state.transactions);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);

  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Calculate overall net balance across all shared groups
  let totalOwedToMe = 0; // People owe me
  let totalIOwe = 0;     // I owe people

  interface DetailedPersonBalance {
    personId: string;
    personName: string;
    amount: number; // positive = owes me, negative = I owe them
  }

  const personBalanceMap = new Map<string, { name: string; net: number }>();

  const sharedGroups = groups.filter((g) => g.type === 'shared');

  sharedGroups.forEach((group) => {
    const groupTxs = transactions.filter((t) => t.groupId === group.id);
    const groupSplits = splits.filter((s) => groupTxs.some((t) => t.id === s.transactionId));
    const balances = calculateGroupBalances(groupTxs, groupSplits);
    const members = groupMembers.filter((m) => m.groupId === group.id);

    balances.forEach((b) => {
      if (b.toUserId === userId) {
        // They owe me
        totalOwedToMe += b.amount;
        const targetMember = members.find((m) => m.userId === b.fromUserId);
        const name = targetMember?.profile?.fullName || targetMember?.profile?.email || 'Friend';
        const existing = personBalanceMap.get(b.fromUserId) || { name, net: 0 };
        personBalanceMap.set(b.fromUserId, { name, net: existing.net + b.amount });
      } else if (b.fromUserId === userId) {
        // I owe them
        totalIOwe += b.amount;
        const targetMember = members.find((m) => m.userId === b.toUserId);
        const name = targetMember?.profile?.fullName || targetMember?.profile?.email || 'Friend';
        const existing = personBalanceMap.get(b.toUserId) || { name, net: 0 };
        personBalanceMap.set(b.toUserId, { name, net: existing.net - b.amount });
      }
    });
  });

  const personBalances = Array.from(personBalanceMap.entries()).map(([id, val]) => ({
    personId: id,
    personName: val.name,
    amount: val.net,
  }));

  const netOverall = totalOwedToMe - totalIOwe;

  return (
    <Card variant="glass" style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Users size={16} color="#3B82F6" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Shared & Split Balances</Text>
        </View>

        {onPressSeeAllGroups && (
          <TouchableOpacity activeOpacity={0.7} onPress={onPressSeeAllGroups} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>Groups</Text>
            <ChevronRight size={14} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Summary KPI Badges */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiBox, { backgroundColor: theme.secondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.kpiLabelRow}>
            <ArrowDownLeft size={13} color={theme.primary} />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Owed to You</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.primary }]}>
            {formatCurrency(totalOwedToMe, currency)}
          </Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: theme.secondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.kpiLabelRow}>
            <ArrowUpRight size={13} color={theme.destructive} />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>You Owe</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.destructive }]}>
            {formatCurrency(totalIOwe, currency)}
          </Text>
        </View>
      </View>

      {/* Individual Quick Balances Breakdown */}
      {personBalances.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            All settled up across all shared groups! ✨
          </Text>
        </View>
      ) : (
        <View style={styles.personList}>
          {personBalances.slice(0, 3).map((item) => {
            const isOwedToMe = item.amount > 0;
            const absAmt = Math.abs(item.amount);
            const initial = item.personName.charAt(0).toUpperCase();

            return (
              <View
                key={item.personId}
                style={[styles.personRow, { borderBottomColor: theme.borderSubtle }]}
              >
                <View style={styles.personLeft}>
                  <View style={[styles.avatar, { backgroundColor: theme.border }]}>
                    <Text style={[styles.avatarText, { color: theme.text }]}>{initial}</Text>
                  </View>
                  <Text style={[styles.personName, { color: theme.text }]}>
                    {item.personName}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.personAmount,
                      { color: isOwedToMe ? theme.primary : theme.destructive },
                    ]}
                  >
                    {isOwedToMe ? `+${formatCurrency(absAmt, currency)}` : `-${formatCurrency(absAmt, currency)}`}
                  </Text>
                  <Text style={[styles.personSubtext, { color: theme.textMuted }]}>
                    {isOwedToMe ? 'owes you' : 'you owe'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  personList: {
    gap: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  personLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  personName: {
    fontSize: 13,
    fontWeight: '600',
  },
  personAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  personSubtext: {
    fontSize: 10,
    fontWeight: '500',
  },
});
