import { Category, Account, Transaction, Budget, UserSettings } from '../types';
import { getTodayIsoDate, getCurrentYearMonth } from '../utils/dateHelpers';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-dining', name: 'Dining & Cafes', icon: '🍔', color: '#F97316', type: 'expense', isEssential: false, isPreset: true },
  { id: 'cat-groceries', name: 'Groceries', icon: '🛒', color: '#10B981', type: 'expense', isEssential: true, isPreset: true },
  { id: 'cat-transport', name: 'Transport & Fuel', icon: '🚕', color: '#3B82F6', type: 'expense', isEssential: true, isPreset: true },
  { id: 'cat-coffee', name: 'Coffee & Snacks', icon: '☕', color: '#F59E0B', type: 'expense', isEssential: false, isPreset: true },
  { id: 'cat-shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense', isEssential: false, isPreset: true },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: '⚡', color: '#8B5CF6', type: 'expense', isEssential: true, isPreset: true },
  { id: 'cat-entertainment', name: 'Entertainment', icon: '🎟️', color: '#6366F1', type: 'expense', isEssential: false, isPreset: true },
  { id: 'cat-health', name: 'Health & Fitness', icon: '💊', color: '#14B8A6', type: 'expense', isEssential: true, isPreset: true },
  { id: 'cat-salary', name: 'Salary / Income', icon: '💰', color: '#10B981', type: 'income', isEssential: false, isPreset: true },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', icon: '💻', color: '#3B82F6', type: 'income', isEssential: false, isPreset: true },
  { id: 'cat-investment', name: 'Investments & Returns', icon: '📈', color: '#8B5CF6', type: 'income', isEssential: false, isPreset: true },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-bank-main', name: 'HDFC / Chase Primary', type: 'bank', startingBalance: 25000, currentBalance: 25000, accountNumberMask: '•• 4821' },
  { id: 'acc-cash', name: 'Physical Cash Wallet', type: 'cash', startingBalance: 3500, currentBalance: 3500 },
  { id: 'acc-cc-one', name: 'Premium Credit Card', type: 'credit_card', startingBalance: 0, currentBalance: 0, accountNumberMask: '•• 9012' },
];

export const INITIAL_SETTINGS: UserSettings = {
  userName: 'Alex',
  currency: 'INR',
  isDarkMode: true,
  safetyBufferPercent: 10,
  monthlyIncomeTarget: 50000,
  paycheckFrequency: 'monthly',
  notificationsEnabled: true,
};

export function getInitialBudgets(): Budget[] {
  const currentMonth = getCurrentYearMonth();
  return [
    { id: 'b-dining', categoryId: 'cat-dining', month: currentMonth, amount: 8000, rollover: false },
    { id: 'b-groceries', categoryId: 'cat-groceries', month: currentMonth, amount: 12000, rollover: false },
    { id: 'b-transport', categoryId: 'cat-transport', month: currentMonth, amount: 4000, rollover: false },
    { id: 'b-coffee', categoryId: 'cat-coffee', month: currentMonth, amount: 2000, rollover: false },
    { id: 'b-entertainment', categoryId: 'cat-entertainment', month: currentMonth, amount: 3500, rollover: false },
    { id: 'b-shopping', categoryId: 'cat-shopping', month: currentMonth, amount: 5000, rollover: false },
    { id: 'b-bills', categoryId: 'cat-bills', month: currentMonth, amount: 6500, rollover: false },
  ];
}

export function getInitialTransactions(): Transaction[] {
  const today = getTodayIsoDate();
  const d = new Date();
  
  const yesterdayDate = new Date(d);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const twoDaysAgoDate = new Date(d);
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgo = `${twoDaysAgoDate.getFullYear()}-${String(twoDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgoDate.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'tx-1',
      amount: 450,
      type: 'expense',
      categoryId: 'cat-groceries',
      accountId: 'acc-bank-main',
      date: today,
      note: 'Whole Foods Market / Fresh Produce',
      paymentMethod: 'UPI / Debit Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      amount: 180,
      type: 'expense',
      categoryId: 'cat-coffee',
      accountId: 'acc-cash',
      date: today,
      note: 'Artisan Espresso with friends',
      paymentMethod: 'Cash',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      amount: 620,
      type: 'expense',
      categoryId: 'cat-dining',
      accountId: 'acc-bank-main',
      date: yesterday,
      note: 'Sweetgreen salad bowl',
      paymentMethod: 'Debit Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      amount: 340,
      type: 'expense',
      categoryId: 'cat-transport',
      accountId: 'acc-bank-main',
      date: yesterday,
      note: 'Uber ride across downtown',
      paymentMethod: 'Credit Card',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      amount: 45000,
      type: 'income',
      categoryId: 'cat-salary',
      accountId: 'acc-bank-main',
      date: twoDaysAgo,
      note: 'Monthly salary credited',
      paymentMethod: 'Direct Deposit',
      createdAt: new Date().toISOString(),
    },
  ];
}
