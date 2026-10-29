import { Transaction } from '../types';

export function getTodayIsoDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getCurrentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatReadableDate(dateString: string): string {
  const today = getTodayIsoDate();
  
  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  if (dateString === today) {
    return 'Today';
  }
  if (dateString === yesterday) {
    return 'Yesterday';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== todayDate.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTimeWithTimezone(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export interface GroupedTransactions {
  dateLabel: string;
  isoDate: string;
  transactions: Transaction[];
}

export function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

export function groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions[] {
  // Sort descending by date, then by creation
  const sorted = sortTransactionsDesc(transactions);

  const map = new Map<string, Transaction[]>();

  sorted.forEach((tx) => {
    const list = map.get(tx.date) || [];
    list.push(tx);
    map.set(tx.date, list);
  });

  const result: GroupedTransactions[] = [];
  map.forEach((txs, dateKey) => {
    result.push({
      dateLabel: formatReadableDate(dateKey),
      isoDate: dateKey,
      transactions: txs,
    });
  });

  return result;
}
