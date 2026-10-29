import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, ShoppingBag, Info } from 'lucide-react-native';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface EssentialRatioCardProps {
  essentialSpend: number;
  discretionarySpend: number;
}

export const EssentialRatioCard: React.FC<EssentialRatioCardProps> = ({
  essentialSpend,
  discretionarySpend,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const totalExpense = essentialSpend + discretionarySpend;
  const essentialPct = totalExpense > 0 ? Math.round((essentialSpend / totalExpense) * 100) : 50;
  const discretionaryPct = 100 - essentialPct;

  return (
    <Card variant="glass" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Info size={16} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            Needs vs Wants Breakdown
          </Text>
        </View>
        <Text style={[styles.targetHint, { color: theme.textMuted }]}>
          50 / 30 / 20 Rule
        </Text>
      </View>

      {/* Progress Split */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.splitBarEssential,
            { width: `${essentialPct}%`, backgroundColor: theme.primary },
          ]}
        />
        <View
          style={[
            styles.splitBarDiscretionary,
            { width: `${discretionaryPct}%`, backgroundColor: theme.accentAmber },
          ]}
        />
      </View>

      {/* Row Metrics */}
      <View style={styles.metricsRow}>
        {/* Needs / Essential */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <View style={[styles.indicatorDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Needs (Essential)
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatCurrency(essentialSpend, currency, { hideDecimals: true })}
            <Text style={[styles.pctText, { color: theme.textMuted }]}> ({essentialPct}%)</Text>
          </Text>
        </View>

        {/* Wants / Discretionary */}
        <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
          <View style={styles.metricLabelRow}>
            <View style={[styles.indicatorDot, { backgroundColor: theme.accentAmber }]} />
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              Wants (Discretionary)
            </Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {formatCurrency(discretionarySpend, currency, { hideDecimals: true })}
            <Text style={[styles.pctText, { color: theme.textMuted }]}> ({discretionaryPct}%)</Text>
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  targetHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  splitBarEssential: {
    height: '100%',
  },
  splitBarDiscretionary: {
    height: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    gap: 3,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  pctText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
