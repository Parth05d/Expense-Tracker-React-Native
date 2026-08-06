import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface CashflowBarChartProps {
  totalIncome: number;
  totalExpense: number;
}

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({
  totalIncome,
  totalExpense,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const maxVal = Math.max(totalIncome, totalExpense, 1);
  const incomeHeightPct = Math.round((totalIncome / maxVal) * 100);
  const expenseHeightPct = Math.round((totalExpense / maxVal) * 100);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <View style={styles.container}>
      {/* Visual Bars */}
      <View style={styles.barsContainer}>
        {/* Income Bar */}
        <View style={styles.barColumn}>
          <Text style={[styles.barTopVal, { color: theme.primary }]}>
            {formatCurrency(totalIncome, currency, { hideDecimals: true })}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                {
                  height: `${Math.max(8, incomeHeightPct)}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: theme.textMuted }]}>Income</Text>
        </View>

        {/* Expense Bar */}
        <View style={styles.barColumn}>
          <Text style={[styles.barTopVal, { color: theme.destructive }]}>
            {formatCurrency(totalExpense, currency, { hideDecimals: true })}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                {
                  height: `${Math.max(8, expenseHeightPct)}%`,
                  backgroundColor: theme.destructive,
                },
              ]}
            />
          </View>
          <Text style={[styles.barLabel, { color: theme.textMuted }]}>Expenses</Text>
        </View>
      </View>

      {/* Net Summary Footer */}
      <View style={[styles.summaryFooter, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
        <View>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>Net Savings</Text>
          <Text
            style={[
              styles.netVal,
              { color: netSavings >= 0 ? theme.primary : theme.destructive },
            ]}
          >
            {netSavings >= 0 ? '+' : ''}
            {formatCurrency(netSavings, currency, { hideDecimals: true })}
          </Text>
        </View>

        <View style={styles.savingsRateCol}>
          <Text style={[styles.footerLabel, { color: theme.textMuted }]}>Savings Rate</Text>
          <Text
            style={[
              styles.rateVal,
              { color: savingsRate >= 20 ? theme.primary : theme.text },
            ]}
          >
            {savingsRate}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 160,
    alignItems: 'flex-end',
    paddingTop: Spacing.lg,
  },
  barColumn: {
    alignItems: 'center',
    width: 90,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopVal: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  track: {
    width: 44,
    height: 110,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  netVal: {
    fontSize: 17,
    fontWeight: '800',
  },
  savingsRateCol: {
    alignItems: 'flex-end',
  },
  rateVal: {
    fontSize: 17,
    fontWeight: '800',
  },
});
