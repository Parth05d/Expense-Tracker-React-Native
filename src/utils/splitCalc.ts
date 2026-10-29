import { Transaction, TransactionSplit } from '../types';

export interface BalanceSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Calculates net balances and generates minimum settlements (who owes whom)
 * based on a list of group transactions and their splits.
 */
export function calculateGroupBalances(transactions: Transaction[], splits: TransactionSplit[]): BalanceSettlement[] {
  // Step 1: Calculate net balance for each user
  // Positive = gets money back (creditor)
  // Negative = owes money (debtor)
  const balances: Record<string, number> = {};

  transactions.forEach(tx => {
    // If there are no splits for this transaction, we skip it
    const txSplits = splits.filter(s => s.transactionId === tx.id);
    if (txSplits.length === 0) return;

    // The person who paid gets a positive credit for the full amount
    const payerId = tx.paidBy || tx.categoryId; // fallback if paidBy not set, shouldn't happen
    if (!balances[payerId]) balances[payerId] = 0;
    balances[payerId] += tx.amount;

    // Everyone who owes a portion gets a negative debit
    txSplits.forEach(split => {
      if (!balances[split.userId]) balances[split.userId] = 0;
      balances[split.userId] -= split.amount;
    });
  });

  // Step 2: Separate into debtors and creditors
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  Object.keys(balances).forEach(userId => {
    const b = balances[userId];
    // Use a small epsilon to avoid floating point zero issues
    if (b < -0.01) debtors.push({ userId, amount: -b }); // absolute amount they owe
    else if (b > 0.01) creditors.push({ userId, amount: b }); // absolute amount they are owed
  });

  // Sort by amount descending to optimize matching large debts first
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Step 3: Match debtors to creditors
  const settlements: BalanceSettlement[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex];
    const creditor = creditors[cIndex];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Number(settledAmount.toFixed(2)),
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) dIndex++;
    if (creditor.amount < 0.01) cIndex++;
  }

  return settlements;
}
