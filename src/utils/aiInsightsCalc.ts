import { Transaction, Budget, Category, UserSettings, TransactionSplit } from '../types';

export interface AIInsightItem {
  id: string;
  type: 'warning' | 'tip' | 'success';
  title: string;
  description: string;
  metric?: string;
  categoryId?: string;
  categoryIcon?: string;
}

export interface AIInsightsSummary {
  dailyVelocity: number;
  projectedMonthEndSpend: number;
  projectedOverage: number;
  insights: AIInsightItem[];
  overallStatus: 'safe' | 'caution' | 'warning';
}

export function calculateAIInsights(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  settings: UserSettings,
  userId: string | null,
  splits: TransactionSplit[],
  currentDate: Date = new Date()
): AIInsightsSummary {
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.max(1, currentDate.getDate());
  const daysRemaining = Math.max(1, totalDaysInMonth - daysElapsed + 1);

  // Filter current month expense transactions
  const currentMonthTx = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
  );

  // Compute spend per category
  const categorySpendMap: Record<string, number> = {};
  let totalSpentSoFar = 0;

  currentMonthTx.forEach((t) => {
    let amt = Number(t.amount) || 0;
    if (t.groupId && t.splitType !== 'none' && userId) {
      const mySplit = splits.find((s) => s.transactionId === t.id && s.userId === userId);
      amt = mySplit ? (Number(mySplit.amount) || 0) : 0;
    }

    if (amt > 0) {
      totalSpentSoFar += amt;
      categorySpendMap[t.categoryId] = (categorySpendMap[t.categoryId] || 0) + amt;
    }
  });

  // Total monthly budget limit
  const currentBudgets = budgets.filter((b) => b.month === currentYearMonth);
  const sumBudgets = currentBudgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalBudget =
    sumBudgets > 0
      ? sumBudgets
      : (Number(settings.monthlyIncomeTarget) || Number(settings.monthlyIncome) || 0);

  // Velocity & Projections
  const dailyVelocity = totalSpentSoFar > 0 ? totalSpentSoFar / daysElapsed : 0;
  const projectedMonthEndSpend =
    totalSpentSoFar > 0 ? Math.round(totalSpentSoFar + dailyVelocity * (daysRemaining - 1)) : 0;
  const projectedOverage = totalBudget > 0 ? Math.max(0, projectedMonthEndSpend - totalBudget) : 0;

  const insights: AIInsightItem[] = [];

  // 1. Zero State / Clean Slate Check
  if (totalSpentSoFar === 0) {
    insights.push({
      id: 'no-data-tip',
      type: 'tip',
      title: 'No Active Expenses',
      description: 'Add your first expense transaction to activate AI spending velocity and month-end forecasts.',
      metric: 'Clean Slate',
    });
  } else if (projectedOverage > 0) {
    // 2. Overall Month-End Pace Insight (Overage)
    insights.push({
      id: 'overall-overage-pace',
      type: 'warning',
      title: 'Month-End Overage Alert',
      description: `At your current pace of ${Math.round(dailyVelocity)}/day, total spend will reach ~${projectedMonthEndSpend}.`,
      metric: `Exceeds budget by ${Math.round(projectedOverage)}`,
    });
  } else {
    // 3. Overall Month-End Pace Insight (Success)
    const savingsProjected = Math.max(0, totalBudget - projectedMonthEndSpend);
    const pacingPercent = totalBudget > 0 ? Math.round((projectedMonthEndSpend / totalBudget) * 100) : 0;
    insights.push({
      id: 'overall-success-pace',
      type: 'success',
      title: 'On-Track Spending Pace',
      description: totalBudget > 0
        ? `You are pacing to finish the month with ~${Math.round(savingsProjected)} unspent!`
        : `Your spending pace is currently ${Math.round(dailyVelocity)}/day.`,
      metric: totalBudget > 0 ? `Pacing ${pacingPercent}% limit` : 'Healthy',
    });
  }

  // 4. Category Burn Rate Insights
  if (totalSpentSoFar > 0) {
    for (const cat of categories.filter((c) => c.type === 'expense')) {
      const catBudgetObj = currentBudgets.find((b) => b.categoryId === cat.id);
      const catBudget = Number(catBudgetObj?.amount) || 0;
      const catSpent = Number(categorySpendMap[cat.id]) || 0;

      if (catBudget > 0) {
        const catVelocity = catSpent / daysElapsed;
        const catProjected = Math.round(catSpent + catVelocity * (daysRemaining - 1));

        if (catSpent > catBudget) {
          insights.push({
            id: `cat-over-${cat.id}`,
            type: 'warning',
            title: `${cat.name} Limit Exceeded`,
            description: `You have spent ${catSpent} against ${catBudget} budget limit.`,
            metric: `Over by ${Math.round(catSpent - catBudget)}`,
            categoryId: cat.id,
            categoryIcon: cat.icon,
          });
        } else if (catVelocity > 0) {
          const remainingBudget = catBudget - catSpent;
          const daysToExhaust = Math.round(remainingBudget / catVelocity);

          if (daysToExhaust < daysRemaining && daysToExhaust > 0) {
            const estimatedBurnDay = daysElapsed + daysToExhaust;
            insights.push({
              id: `cat-burn-${cat.id}`,
              type: 'warning',
              title: `${cat.name} Burning Fast`,
              description: `At current pace, this category will run out of budget around Day ${estimatedBurnDay} of the month.`,
              metric: `Pacing ${Math.round((catProjected / catBudget) * 100)}% limit`,
              categoryId: cat.id,
              categoryIcon: cat.icon,
            });
          }
        }
      }
    }
  }

  const overallStatus = insights.some((i) => i.type === 'warning')
    ? 'warning'
    : insights.some((i) => i.type === 'tip')
    ? 'caution'
    : 'safe';

  return {
    dailyVelocity: Math.round(dailyVelocity),
    projectedMonthEndSpend,
    projectedOverage: Math.round(projectedOverage),
    insights,
    overallStatus,
  };
}
