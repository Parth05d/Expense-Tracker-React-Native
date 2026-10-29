import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Calendar,
  PieChart,
  Sliders,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { Card } from '../common/Card';
import { ProgressRing } from '../common/ProgressRing';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { calculateNextSalaryInfo } from '../../utils/salaryCalc';
import { showGlassAlert } from '../common/GlassAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

interface HeroCardsCarouselProps {
  onPressConfigureAllocation?: () => void;
  onPressConfigureSalary?: () => void;
}

export const HeroCardsCarousel: React.FC<HeroCardsCarouselProps> = ({
  onPressConfigureAllocation,
  onPressConfigureSalary,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const settings = useExpenseStore((state) => state.settings);
  const transactions = useExpenseStore((state) => state.transactions);
  const categories = useExpenseStore((state) => state.categories);
  const accounts = useExpenseStore((state) => state.accounts);
  const addTransaction = useExpenseStore((state) => state.addTransaction);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const [activeIndex, setActiveIndex] = useState(0);

  // 1. Payday Countdown Metrics
  const salaryInfo = calculateNextSalaryInfo(settings);

  // 2. Income Allocation Metrics
  const monthlyIncome = settings.monthlyIncomeTarget || settings.monthlyIncome || 50000;
  const allocations = settings.incomeAllocations || {};
  
  const totalAllocatedPercent = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const totalAllocatedAmount = Math.round((monthlyIncome * totalAllocatedPercent) / 100);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthKey))
    .reduce((sum, t) => sum + t.amount, 0);

  const netRemainingIncome = Math.max(0, monthlyIncome - currentMonthExpenses);
  const spentPercentOfIncome = monthlyIncome > 0
    ? Math.min(100, Math.round((currentMonthExpenses / monthlyIncome) * 100))
    : 0;

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH + Spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {/* SLIDE 1: INCOME ALLOCATION ENGINE HERO CARD */}
        <View style={{ width: CARD_WIDTH }}>
          <Card variant="glass" style={styles.heroCard}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <PieChart size={16} color={theme.primary} />
                <Text style={[styles.title, { color: theme.textMuted }]}>
                  Income Allocation Plan
                </Text>
              </View>

              <TouchableOpacity
                onPress={onPressConfigureAllocation}
                style={[styles.configureChip, { backgroundColor: theme.primaryDim }]}
              >
                <Sliders size={12} color={theme.primary} />
                <Text style={[styles.configureChipText, { color: theme.primary }]}>Configure %</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ringContainer}>
              <ProgressRing
                progress={100 - spentPercentOfIncome}
                heroValue={formatCurrency(netRemainingIncome, currency, { hideDecimals: true })}
                subLabel={`Unspent of ${formatCurrency(monthlyIncome, currency, { hideDecimals: true })}`}
                status={spentPercentOfIncome > 90 ? 'exhausted' : spentPercentOfIncome > 75 ? 'caution' : 'safe'}
              />
            </View>

            <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
              <View style={styles.footerCol}>
                <View style={styles.footerLabelRow}>
                  <CheckCircle2 size={14} color={theme.primary} />
                  <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
                    Target Allocated
                  </Text>
                </View>
                <Text style={[styles.footerValue, { color: theme.text }]}>
                  {totalAllocatedPercent}%
                  <Text style={[styles.perDayText, { color: theme.textMuted }]}> ({formatCurrency(totalAllocatedAmount, currency, { hideDecimals: true })})</Text>
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
                <View style={styles.footerLabelRow}>
                  <ArrowUpRight size={14} color={theme.textMuted} />
                  <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
                    Spent So Far
                  </Text>
                </View>
                <Text style={[styles.footerValue, { color: theme.text }]}>
                  {formatCurrency(currentMonthExpenses, currency, { hideDecimals: true })}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* SLIDE 2: PAYDAY & SALARY COUNTDOWN HERO CARD */}
        <View style={{ width: CARD_WIDTH }}>
          <Card variant="glass" style={styles.heroCard}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Calendar size={16} color={theme.primary} />
                <Text style={[styles.title, { color: theme.textMuted }]}>
                  Next Payday Countdown
                </Text>
              </View>

              <TouchableOpacity
                onPress={onPressConfigureSalary}
                style={[styles.configureChip, { backgroundColor: theme.primaryDim }]}
              >
                <Sliders size={12} color={theme.primary} />
                <Text style={[styles.configureChipText, { color: theme.primary }]}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ringContainer}>
              <ProgressRing
                progress={Math.max(5, 100 - salaryInfo.daysUntilPayday * 3)}
                heroValue={formatCurrency(salaryInfo.expectedAmount, currency, { hideDecimals: true })}
                subLabel={salaryInfo.formattedCountdown}
                status={salaryInfo.isTodayPayday ? 'safe' : 'caution'}
              />
            </View>

            <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogSalaryNow}
                style={[styles.quickLogBtn, { backgroundColor: theme.primaryDim }]}
              >
                <ArrowUpRight size={14} color={theme.primary} />
                <Text style={[styles.quickLogText, { color: theme.primary }]}>
                  1-Tap Record Income ({formatCurrency(salaryInfo.expectedAmount, currency, { hideDecimals: true })})
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        <View style={[styles.dot, activeIndex === 0 ? [styles.dotActive, { backgroundColor: theme.primary }] : styles.dotInactive]} />
        <View style={[styles.dot, activeIndex === 1 ? [styles.dotActive, { backgroundColor: theme.primary }] : styles.dotInactive]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginBottom: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    padding: Spacing.lg,
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
  configureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  configureChipText: {
    fontSize: 11,
    fontWeight: '700',
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
  quickLogBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
