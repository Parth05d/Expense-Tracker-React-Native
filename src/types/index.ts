export type TransactionType = 'income' | 'expense';

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'wallet';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  isEssential: boolean; // Essential (rent, groceries) vs Discretionary (entertainment, dining out)
  isPreset: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  startingBalance: number;
  currentBalance: number;
  accountNumberMask?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  date: string; // ISO format: YYYY-MM-DD
  note?: string;
  paymentMethod?: string;
  isBusiness?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: 'weekly' | 'monthly' | 'yearly';
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // Format: YYYY-MM
  amount: number;
  rollover: boolean;
}

export interface CurrencyConfig {
  code: CurrencyCode | string;
  symbol: string;
  name: string;
  position: 'prefix' | 'suffix';
  decimalPlaces: number;
}

export interface UserSettings {
  userName: string;
  currency: CurrencyCode | string; // Currency code e.g. 'INR', 'USD', 'EUR', 'GBP'
  isDarkMode: boolean;
  safetyBufferPercent: number; // e.g. 10 for 10%
  safetyBufferPercentage?: number;
  monthlyIncomeTarget?: number;
  monthlyIncome?: number;
  paycheckFrequency?: 'monthly' | 'biweekly' | 'weekly';
  nextPaycheckDate?: string;
  notificationsEnabled?: boolean;
}

export interface GuiltFreeMetrics {
  totalMonthlyBudget: number;
  essentialSpent: number;
  discretionarySpent: number;
  committedUpcomingBills: number;
  safetyBufferAmount: number;
  guiltFreeRemaining: number;
  safeToSpendPerDay: number;
  daysRemainingInMonth: number;
  percentageUsed: number;
  status: 'safe' | 'caution' | 'exhausted';
}
