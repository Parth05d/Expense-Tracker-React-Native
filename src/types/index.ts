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
  allocationPercent?: number; // Target percentage allocation of monthly income
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
  groupId?: string; // Phase 7: Null if personal
  splitType?: 'equal' | 'percentage' | 'custom' | 'none'; // Phase 7
  paidBy?: string; // Phase 7: user UUID
  createdAt: string;
}

// Phase 7: Family Groups & Splitwise Logic
export interface Group {
  id: string;
  name: string;
  type: 'shared' | 'family';
  createdBy: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'adult' | 'teen' | 'child';
  joinedAt: string;
  // Hydrated field from Profiles for UI convenience
  profile?: {
    email: string;
    fullName: string;
  };
}

export interface TransactionSplit {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  percentage?: number;
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

export interface CustomSalaryEvent {
  id: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  description: string;
}

export interface UserSettings {
  userName: string;
  avatarUrl?: string;
  currency: CurrencyCode | string; // Currency code e.g. 'INR', 'USD', 'EUR', 'GBP'
  isDarkMode: boolean;
  safetyBufferPercent: number; // e.g. 10 for 10%
  safetyBufferPercentage?: number;
  monthlyIncomeTarget?: number;
  monthlyIncome?: number;
  paycheckFrequency?: 'monthly' | 'biweekly' | 'weekly' | 'custom';
  payCycle?: 'monthly' | 'biweekly' | 'weekly' | 'custom';
  salaryDayOfMonth?: number; // 1 to 31 (e.g. 1st or 15th of month)
  salaryDayOfMonth2?: number; // 1 to 31 (e.g. 15th or 25th of month for bi-weekly)
  salaryDayOfWeek?: number; // 0 (Sun) to 6 (Sat), e.g. 5 for Friday
  nextPaycheckDate?: string;
  customSalaryEvents?: CustomSalaryEvent[];
  notificationsEnabled?: boolean;
  incomeAllocations?: Record<string, number>; // Maps categoryId -> percentage integer (e.g. { cat_1: 30, cat_2: 20 })
}

export type ReminderType = 'bill_payment' | 'emi' | 'sip' | 'money_receivable' | 'subscription' | 'personal' | 'other';

export interface Reminder {
  id: string;
  userId?: string;
  title: string;
  amount: number;
  type: ReminderType;
  dueDate: string; // ISO format: YYYY-MM-DD
  categoryId?: string;
  note?: string;
  isCompleted: boolean;
  recurringPeriod?: 'none' | 'weekly' | 'monthly' | 'yearly';
  notificationId?: string;
  createdAt: string;
}
