import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, ShieldCheck, Calendar } from 'lucide-react-native';
import { Card } from '../common/Card';
import { ProgressRing } from '../common/ProgressRing';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

export const GuiltFreeHeroCard: React.FC = () => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const getGuiltFreeMetrics = useExpenseStore((state) => state.getGuiltFreeMetrics);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const metrics = getGuiltFreeMetrics();

  const formattedGuiltFree = formatCurrency(metrics.guiltFreeRemaining, currency, {
    hideDecimals: true,
  });
  const formattedDaily = formatCurrency(metrics.safeToSpendPerDay, currency, {
    hideDecimals: true,
  });

  // Calculate ring percentage: percentage of guilt-free funds remaining
  const remainingPercent = metrics.totalMonthlyBudget > 0
    ? Math.max(0, Math.round((metrics.guiltFreeRemaining / metrics.totalMonthlyBudget) * 100))
    : 0;

  return (
    <Card variant="glass" style={styles.card}>
      {/* Card Header Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={16} color={theme.primary} />
          <Text style={[styles.title, { color: theme.textMuted }]}>
            Guilt-Free Spending
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: metrics.status === 'safe' ? theme.primaryDim : theme.destructiveDim }]}>
          <Text
            style={[
              styles.badgeText,
              { color: metrics.status === 'safe' ? theme.primary : theme.destructive },
            ]}
          >
            {metrics.status === 'safe' ? 'On Track' : metrics.status === 'caution' ? 'Caution' : 'Over Limit'}
          </Text>
        </View>
      </View>

      {/* Hero Circular Progress Ring */}
      <View style={styles.ringContainer}>
        <ProgressRing
          progress={remainingPercent}
          heroValue={formattedGuiltFree}
          subLabel="Room left this month"
          status={metrics.status}
        />
      </View>

      {/* Footer Metrics */}
      <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.footerCol}>
          <View style={styles.footerLabelRow}>
            <ShieldCheck size={14} color={theme.primary} />
            <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
              Safe to spend
            </Text>
          </View>
          <Text style={[styles.footerValue, { color: theme.text }]}>
            {formattedDaily}
            <Text style={[styles.perDayText, { color: theme.textMuted }]}> / day</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
          <View style={styles.footerLabelRow}>
            <Calendar size={14} color={theme.textMuted} />
            <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
              Days left
            </Text>
          </View>
          <Text style={[styles.footerValue, { color: theme.text }]}>
            {metrics.daysRemainingInMonth} days
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ringContainer: {
    marginVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  footerCol: {
    flex: 1,
  },
  footerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  perDayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: Spacing.md,
  },
});
