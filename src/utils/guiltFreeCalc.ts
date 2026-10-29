import { Transaction, Budget, Category, UserSettings, GuiltFreeMetrics, TransactionSplit } from '../types';

export function calculateGuiltFreeMetrics(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  settings: UserSettings,
  userId: string | null,
  splits: TransactionSplit[],
  currentDate: Date = new Date()
): GuiltFreeMetrics {
  const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // 1. Total monthly budget (sum of all category budgets for the current month, or fallback target)
  const currentMonthBudgets = budgets.filter((b) => b.month === currentYearMonth);
  const totalBudgetFromCategories = currentMonthBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalMonthlyBudget = totalBudgetFromCategories > 0 
    ? totalBudgetFromCategories 
    : (settings.monthlyIncomeTarget || 3000);

  // 2. Filter transactions for the current month
  const currentMonthTransactions = transactions.filter((t) => {
    return t.date.startsWith(currentYearMonth) && t.type === 'expense';
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  let essentialSpent = 0;
  let discretionarySpent = 0;

  currentMonthTransactions.forEach((t) => {
    let personalAmount = t.amount;
    
    // If it's a split transaction, find the user's portion
    if (t.groupId && t.splitType !== 'none' && userId) {
      const txSplits = splits.filter(s => s.transactionId === t.id);
      if (txSplits.length > 0) {
        const mySplit = txSplits.find(s => s.userId === userId);
        personalAmount = mySplit ? mySplit.amount : 0;
      }
    }

    if (personalAmount > 0) {
      const category = categoryMap.get(t.categoryId);
      if (category?.isEssential) {
        essentialSpent += personalAmount;
      } else {
        discretionarySpent += personalAmount;
      }
    }
  });

  // 3. Committed upcoming recurring bills (recurring expenses that haven't occurred yet this month)
  const committedUpcomingBills = transactions
    .filter((t) => t.isRecurring && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) * 0.15; // Estimated upcoming portion

  // 4. Safety buffer
  const safetyBufferPercent = (settings.safetyBufferPercent || 10) / 100;
  const safetyBufferAmount = totalMonthlyBudget * safetyBufferPercent;

  // 5. Guilt-Free Remaining calculation
  const guiltFreeRemaining = Math.max(
    0,
    totalMonthlyBudget - essentialSpent - committedUpcomingBills - discretionarySpent - safetyBufferAmount
  );

  // 6. Days remaining in month calculation
  const totalDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const daysRemainingInMonth = Math.max(1, totalDaysInMonth - currentDay + 1);

  // 7. Safe to spend per day
  const safeToSpendPerDay = Math.max(0, Math.round(guiltFreeRemaining / daysRemainingInMonth));

  // 8. Percentage used
  const totalSpent = essentialSpent + discretionarySpent;
  const percentageUsed = totalMonthlyBudget > 0 
    ? Math.min(100, Math.round((totalSpent / totalMonthlyBudget) * 100))
    : 0;

  // 9. Status indicator
  let status: 'safe' | 'caution' | 'exhausted' = 'safe';
  if (guiltFreeRemaining <= 0 || percentageUsed >= 95) {
    status = 'exhausted';
  } else if (percentageUsed >= 75) {
    status = 'caution';
  }

  return {
    totalMonthlyBudget,
    essentialSpent,
    discretionarySpent,
    committedUpcomingBills,
    safetyBufferAmount,
    guiltFreeRemaining,
    safeToSpendPerDay,
    daysRemainingInMonth,
    percentageUsed,
    status,
  };
}
