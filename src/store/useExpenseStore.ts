import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget, Account, UserSettings, GuiltFreeMetrics } from '../types';
import { INITIAL_CATEGORIES, INITIAL_ACCOUNTS, INITIAL_SETTINGS, getInitialBudgets, getInitialTransactions } from './seedData';
import { calculateGuiltFreeMetrics } from '../utils/guiltFreeCalc';

interface ExpenseState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  settings: UserSettings;

  // Transactions Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budget Actions
  setBudget: (categoryId: string, amount: number, month: string) => void;
  updateBudget: (id: string, amount: number) => void;

  // Account Actions
  addAccount: (account: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Settings Actions
  updateSettings: (settings: Partial<UserSettings>) => void;
  setCurrency: (currency: string) => void;
  toggleDarkMode: () => void;
  
  // Data Management
  resetToDefaults: () => void;
  importState: (importedState: {
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    accounts: Account[];
    settings: UserSettings;
  }) => void;

  // Selectors / Computed
  getGuiltFreeMetrics: () => GuiltFreeMetrics;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getCategorySpend: (categoryId: string, month?: string) => number;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      transactions: getInitialTransactions(),
      categories: INITIAL_CATEGORIES,
      budgets: getInitialBudgets(),
      accounts: INITIAL_ACCOUNTS,
      settings: INITIAL_SETTINGS,

      // --- Transactions ---
      addTransaction: (txData) => {
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          // Update corresponding account balance
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === newTx.accountId) {
              const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + delta };
            }
            return acc;
          });

          return {
            transactions: [newTx, ...state.transactions],
            accounts: updatedAccounts,
          };
        });

        return newTx;
      },

      updateTransaction: (id, txData) => {
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id);
          if (!oldTx) return state;

          let updatedAccounts = [...state.accounts];
          
          // Reverse old transaction impact
          updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === oldTx.accountId) {
              const reverseDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + reverseDelta };
            }
            return acc;
          });

          const updatedTx: Transaction = { ...oldTx, ...txData };

          // Apply new transaction impact
          updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === updatedTx.accountId) {
              const newDelta = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + newDelta };
            }
            return acc;
          });

          return {
            transactions: state.transactions.map((t) => (t.id === id ? updatedTx : t)),
            accounts: updatedAccounts,
          };
        });
      },

      deleteTransaction: (id) => {
        set((state) => {
          const target = state.transactions.find((t) => t.id === id);
          if (!target) return state;

          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === target.accountId) {
              const reverseDelta = target.type === 'income' ? -target.amount : target.amount;
              return { ...acc, currentBalance: acc.currentBalance + reverseDelta };
            }
            return acc;
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
          };
        });
      },

      // --- Categories ---
      addCategory: (categoryData) => {
        const newCat: Category = {
          ...categoryData,
          id: `cat-${Date.now()}`,
        };
        set((state) => ({ categories: [...state.categories, newCat] }));
        return newCat;
      },

      updateCategory: (id, categoryData) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...categoryData } : c)),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          budgets: state.budgets.filter((b) => b.categoryId !== id),
        }));
      },

      // --- Budgets ---
      setBudget: (categoryId, amount, month) => {
        set((state) => {
          const existing = state.budgets.find(
            (b) => b.categoryId === categoryId && b.month === month
          );
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.id === existing.id ? { ...b, amount } : b
              ),
            };
          }
          const newBudget: Budget = {
            id: `b-${Date.now()}`,
            categoryId,
            month,
            amount,
            rollover: false,
          };
          return { budgets: [...state.budgets, newBudget] };
        });
      },

      updateBudget: (id, amount) => {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === id ? { ...b, amount } : b)),
        }));
      },

      // --- Accounts ---
      addAccount: (accountData) => {
        const newAccount: Account = {
          ...accountData,
          id: `acc-${Date.now()}`,
        };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
        return newAccount;
      },

      updateAccount: (id, accountData) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...accountData } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));
      },

      // --- Settings ---
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setCurrency: (currency) => {
        set((state) => ({
          settings: { ...state.settings, currency },
        }));
      },

      toggleDarkMode: () => {
        set((state) => ({
          settings: { ...state.settings, isDarkMode: !state.settings.isDarkMode },
        }));
      },

      resetToDefaults: () => {
        set({
          transactions: getInitialTransactions(),
          categories: INITIAL_CATEGORIES,
          budgets: getInitialBudgets(),
          accounts: INITIAL_ACCOUNTS,
          settings: INITIAL_SETTINGS,
        });
      },

      importState: (importedState) => {
        set({
          transactions: importedState.transactions || [],
          categories: importedState.categories || INITIAL_CATEGORIES,
          budgets: importedState.budgets || [],
          accounts: importedState.accounts || INITIAL_ACCOUNTS,
          settings: importedState.settings || INITIAL_SETTINGS,
        });
      },

      // --- Selectors ---
      getGuiltFreeMetrics: () => {
        const state = get();
        return calculateGuiltFreeMetrics(
          state.transactions,
          state.budgets,
          state.categories,
          state.settings
        );
      },

      getTransactionsByCategory: (categoryId) => {
        return get().transactions.filter((t) => t.categoryId === categoryId);
      },

      getCategorySpend: (categoryId, month) => {
        const state = get();
        const currentMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        return state.transactions
          .filter((t) => t.categoryId === categoryId && t.type === 'expense' && t.date.startsWith(currentMonth))
          .reduce((sum, t) => sum + t.amount, 0);
      },
    }),
    {
      name: 'guilt-free-expense-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
