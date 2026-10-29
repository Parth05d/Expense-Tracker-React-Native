import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bot, AlertTriangle, TrendingUp, CheckCircle, Sparkles, ChevronRight } from 'lucide-react-native';
import { Card } from '../common/Card';
import { useExpenseStore } from '../../store/useExpenseStore';
import { calculateAIInsights } from '../../utils/aiInsightsCalc';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface AIInsightsCardProps {
  onPressSeeDetails?: () => void;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ onPressSeeDetails }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const transactions = useExpenseStore((state) => state.transactions);
  const budgets = useExpenseStore((state) => state.budgets);
  const categories = useExpenseStore((state) => state.categories);
  const settings = useExpenseStore((state) => state.settings);
  const userId = useExpenseStore((state) => state.userId);
  const splits = useExpenseStore((state) => state.splits);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const summary = calculateAIInsights(transactions, budgets, categories, settings, userId, splits);

  const primaryInsight = summary.insights[0];

  return (
    <Card variant="glass" style={styles.card}>
      {/* Specular Edge */}
      <View style={styles.glassSheenLine} />

      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.botIconWrapper, { backgroundColor: theme.primaryDim }]}>
            <Bot size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>AI Spending Intelligence</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Pacing ~{formatCurrency(summary.dailyVelocity, currency, { hideDecimals: true })}/day
            </Text>
          </View>
        </View>

        {summary.projectedOverage > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.destructiveDim }]}>
            <Text style={[styles.badgeText, { color: theme.destructive }]}>Pace Warning</Text>
          </View>
        ) : summary.dailyVelocity === 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
            <Text style={[styles.badgeText, { color: theme.textMuted }]}>Clean Slate</Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: theme.primaryDim }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>Healthy Pace</Text>
          </View>
        )}
      </View>

      {/* Primary Insight Highlight Box */}
      {primaryInsight && (
        <View
          style={[
            styles.insightBox,
            {
              backgroundColor: primaryInsight.type === 'warning' ? theme.destructiveDim : theme.secondary,
              borderColor: primaryInsight.type === 'warning' ? theme.destructive : theme.borderSubtle,
            },
          ]}
        >
          <View style={styles.insightTopRow}>
            {primaryInsight.type === 'warning' ? (
              <AlertTriangle size={16} color={theme.destructive} />
            ) : primaryInsight.type === 'success' ? (
              <CheckCircle size={16} color={theme.primary} />
            ) : (
              <Sparkles size={16} color={theme.accentAmber} />
            )}
            <Text
              style={[
                styles.insightTitle,
                { color: primaryInsight.type === 'warning' ? theme.destructive : theme.text },
              ]}
            >
              {primaryInsight.title}
            </Text>

            {primaryInsight.metric && (
              <View style={[styles.metricChip, { backgroundColor: theme.cardGlass }]}>
                <Text style={[styles.metricText, { color: theme.primary }]}>{primaryInsight.metric}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.insightDesc, { color: theme.textMuted }]}>
            {primaryInsight.description}
          </Text>
        </View>
      )}

      {/* Velocity Stats Grid */}
      <View style={[styles.statsRow, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Daily Pace</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatCurrency(summary.dailyVelocity, currency, { hideDecimals: true })}
            <Text style={{ fontSize: 11, fontWeight: '500', color: theme.textMuted }}> /day</Text>
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Projected Month-End</Text>
          <Text style={[styles.statValue, { color: summary.projectedOverage > 0 ? theme.destructive : theme.primary }]}>
            {formatCurrency(summary.projectedMonthEndSpend, currency, { hideDecimals: true })}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  botIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  insightBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  insightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  metricChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '700',
  },
  insightDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: 2,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: Spacing.sm,
  },
});
