import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, DollarSign, ArrowUpRight, Sliders, CheckCircle } from 'lucide-react-native';
import { Card } from '../common/Card';
import { useExpenseStore } from '../../store/useExpenseStore';
import { calculateNextSalaryInfo } from '../../utils/salaryCalc';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { showGlassAlert } from '../common/GlassAlert';

interface PaydayCountdownCardProps {
  onPressConfigure?: () => void;
}

export const PaydayCountdownCard: React.FC<PaydayCountdownCardProps> = ({ onPressConfigure }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const settings = useExpenseStore((state) => state.settings);
  const accounts = useExpenseStore((state) => state.accounts);
  const categories = useExpenseStore((state) => state.categories);
  const addTransaction = useExpenseStore((state) => state.addTransaction);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const salaryInfo = calculateNextSalaryInfo(settings);

  const handleLogSalaryNow = () => {
    const salaryCat = categories.find((c) => c.type === 'income') || categories[0];
    const defaultAcc = accounts[0];

    if (!defaultAcc) {
      showGlassAlert('No Account Found', 'Please add a bank or cash account first.', undefined, 'error');
      return;
    }

    addTransaction({
      amount: salaryInfo.expectedAmount,
      type: 'income',
      categoryId: salaryCat ? salaryCat.id : '',
      accountId: defaultAcc.id,
      date: salaryInfo.nextPayDateIso,
      note: `Salary Income (${salaryInfo.payCycle.toUpperCase()})`,
    });

    showGlassAlert(
      'Salary Recorded! 🎉',
      `${formatCurrency(salaryInfo.expectedAmount, currency)} income logged to ${defaultAcc.name}.`,
      undefined,
      'success'
    );
  };

  return (
    <Card variant="glass" style={styles.card}>
      {/* Specular Sheen */}
      <View style={styles.glassSheenLine} />

      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={onPressConfigure} style={styles.headerTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.primaryDim }]}>
            <Calendar size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Next Payday Countdown</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Cycle: {salaryInfo.payCycle.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressConfigure}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[styles.configChip, { backgroundColor: theme.primaryDim }]}
        >
          <Sliders size={12} color={theme.primary} />
          <Text style={[styles.configText, { color: theme.primary }]}>Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.amountBox}>
          <Text style={[styles.amountLabel, { color: theme.textMuted }]}>Expected Salary</Text>
          <Text style={[styles.amountValue, { color: theme.primary }]}>
            {formatCurrency(salaryInfo.expectedAmount, currency, { hideDecimals: true })}
          </Text>
        </View>

        <View style={[styles.countdownBadge, { backgroundColor: salaryInfo.isTodayPayday ? theme.primaryDim : theme.secondary }]}>
          <Text style={[styles.countdownText, { color: salaryInfo.isTodayPayday ? theme.primary : theme.text }]}>
            {salaryInfo.formattedCountdown}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLogSalaryNow}
        style={[styles.quickLogBtn, { backgroundColor: theme.primaryDim }]}
      >
        <ArrowUpRight size={16} color={theme.primary} />
        <Text style={[styles.quickLogText, { color: theme.primary }]}>
          1-Tap Log Received Salary ({formatCurrency(salaryInfo.expectedAmount, currency, { hideDecimals: true })})
        </Text>
      </TouchableOpacity>
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
  iconBox: {
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
  configChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  configText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  amountBox: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countdownBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    marginTop: 2,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
