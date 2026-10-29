import { Category, Account, Transaction, Budget, UserSettings } from '../types';

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

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_SETTINGS: UserSettings = {
  userName: 'User',
  currency: 'INR',
  isDarkMode: true,
  safetyBufferPercent: 10,
  monthlyIncomeTarget: 0,
  monthlyIncome: 0,
  incomeAllocations: {},
};

export function getInitialBudgets(): Budget[] {
  return [];
}

export function getInitialTransactions(): Transaction[] {
  return [];
}
