import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Category,
  Budget,
  Account,
  UserSettings,
  CurrencyCode,
  Group,
  GroupMember,
  TransactionSplit,
  Reminder,
  ReminderType,
} from '../types';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import { checkIsOnline, subscribeToNetworkStatus } from '../utils/network';
import { showGlassAlert } from '../components/common/GlassAlert';
import { scheduleReminderNotification, cancelReminderNotification, sendInstantPushNotification } from '../services/notificationService';

export type SyncActionType =
  | 'ADD_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'ADD_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'SET_BUDGET'
  | 'UPDATE_BUDGET'
  | 'ADD_ACCOUNT'
  | 'UPDATE_ACCOUNT'
  | 'DELETE_ACCOUNT'
  | 'CREATE_GROUP'
  | 'UPDATE_GROUP'
  | 'DELETE_GROUP'
  | 'ADD_GROUP_MEMBER'
  | 'REMOVE_GROUP_MEMBER'
  | 'UPDATE_SETTINGS'
  | 'ADD_REMINDER'
  | 'UPDATE_REMINDER'
  | 'DELETE_REMINDER';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
  retryCount?: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  userName: 'User',
  currency: 'INR',
  isDarkMode: true,
  safetyBufferPercent: 10,
  monthlyIncomeTarget: 0,
  monthlyIncome: 0,
  incomeAllocations: {},
};

const generateTempId = (prefix: string = 'temp') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

interface ExpenseState {
  userId: string | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  settings: UserSettings;
  reminders: Reminder[];

  // Groups & Splits
  groups: Group[];
  groupMembers: GroupMember[];
  splits: TransactionSplit[];

  // Offline First State
  isOffline: boolean;
  isSyncing: boolean;
  syncQueue: SyncAction[];

  // Offline Actions
  setOfflineStatus: (isOffline: boolean) => void;
  processSyncQueue: () => Promise<void>;

  // Core Actions
  fetchInitialData: (userId: string) => Promise<void>;

  // Transactions
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'createdAt'>,
    initialSplits?: Omit<TransactionSplit, 'id' | 'transactionId'>[]
  ) => Promise<Transaction | null>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  createCategory: (category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Budgets
  setBudget: (categoryId: string, amount: number, month: string) => Promise<void>;
  updateBudget: (id: string, amount: number) => Promise<void>;

  // Accounts
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account | null>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Groups
  createGroup: (name: string, type: 'shared' | 'family') => Promise<Group | null>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addMemberToGroup: (
    groupId: string,
    email: string,
    role: 'admin' | 'adult' | 'teen' | 'child'
  ) => Promise<boolean>;
  removeMemberFromGroup: (memberId: string) => Promise<void>;

  // Custom Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>) => Promise<Reminder | null>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderComplete: (id: string, convertToTransaction?: boolean, accountId?: string) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateIncomeAllocations: (allocations: Record<string, number>, applyToBudgets?: boolean) => Promise<void>;
  applyPresetAllocations: (preset: '50/30/20' | '60/20/20' | 'equal') => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  toggleDarkMode: () => Promise<void>;

  // Data Management
  resetToDefaults: () => Promise<void>;

  // Selectors
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getCategorySpend: (categoryId: string, month?: string) => number;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      userId: null,
      transactions: [],
      categories: [],
      budgets: [],
      accounts: [],
      settings: DEFAULT_SETTINGS,
      reminders: [],
      groups: [],
      groupMembers: [],
      splits: [],

      isOffline: false,
      isSyncing: false,
      syncQueue: [],

      setOfflineStatus: (isOffline: boolean) => {
        set({ isOffline });
      },

      fetchInitialData: async (userId: string) => {
        set({ userId });

        const online = await checkIsOnline();
        if (!online) {
          set({ isOffline: true });
          return;
        }

        // Process any existing pending sync queue before fetching fresh server data
        await get().processSyncQueue();

        try {
          // Fetch Profile
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (profileErr && profileErr.code === 'PGRST116') {
            // Profile missing, skip error handling if offline
          }

          // Fetch Monthly Settings
          const currentMonth = `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, '0')}-01`;
          const { data: monthlySettings } = await supabase
            .from('monthly_budget_settings')
            .select('*')
            .eq('user_id', userId)
            .eq('month', currentMonth)
            .maybeSingle();

          // Fetch categories
          const { data: categories, error: catErr } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${userId},is_preset.eq.true`);

          if (catErr) throw catErr;

          // Fetch accounts
          const { data: accounts, error: accErr } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId);

          if (accErr) throw accErr;

          let finalAccounts = accounts || [];

          // Clean up any duplicate accounts
          const seenNames = new Set<string>();
          const duplicateIds: string[] = [];
          finalAccounts = finalAccounts.filter((acc) => {
            if (seenNames.has(acc.name.toLowerCase())) {
              duplicateIds.push(acc.id);
              return false;
            }
            seenNames.add(acc.name.toLowerCase());
            return true;
          });

          if (duplicateIds.length > 0) {
            supabase.from('accounts').delete().in('id', duplicateIds).then();
          }

          // If no accounts exist, create a default cash account
          if (finalAccounts.length === 0) {
            const { data: newAcc } = await supabase
              .from('accounts')
              .insert({
                user_id: userId,
                name: 'Cash',
                type: 'cash',
                current_balance: 0,
              })
              .select()
              .single();
            if (newAcc) finalAccounts = [newAcc];
          }

          // Fetch transactions
          const { data: transactions, error: txErr } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId);

          if (txErr) throw txErr;

          // Fetch Budgets
          const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId);

          // Fetch Reminders
          let remindersData: any[] = [];
          try {
            const { data: rData } = await supabase
              .from('reminders')
              .select('*')
              .eq('user_id', userId)
              .order('due_date', { ascending: true });
            remindersData = rData || [];
          } catch (remErr) {}

          // Fetch Groups
          const { data: groupIdsResult } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId);
          const userGroupIds = groupIdsResult?.map((g) => g.group_id) || [];

          let groups: any[] = [];
          let groupMembers: any[] = [];
          let splits: any[] = [];

          if (userGroupIds.length > 0) {
            const { data: gData } = await supabase
              .from('groups')
              .select('*')
              .in('id', userGroupIds);
            groups = gData || [];

            const { data: gmData } = await supabase
              .from('group_members')
              .select('*, profiles(email, full_name)')
              .in('group_id', userGroupIds);
            groupMembers = gmData || [];

            const txIds = transactions?.map((t) => t.id) || [];
            if (txIds.length > 0) {
              const { data: sData } = await supabase
                .from('transaction_splits')
                .select('*')
                .in('transaction_id', txIds);
              splits = sData || [];
            }
          } else {
            const txIds = transactions?.map((t) => t.id) || [];
            if (txIds.length > 0) {
              const { data: sData } = await supabase
                .from('transaction_splits')
                .select('*')
                .in('transaction_id', txIds);
              splits = sData || [];
            }
          }

          const mappedBudgets = (budgets || []).map((b) => ({
            id: b.id,
            categoryId: b.category_id,
            month: b.month,
            amount: b.amount,
            rollover: b.rollover,
          }));

          const existingSettings = get().settings || {};
          let parsedAllocations: Record<string, number> = {};

          if (monthlySettings?.income_allocations) {
            try {
              parsedAllocations = typeof monthlySettings.income_allocations === 'string'
                ? JSON.parse(monthlySettings.income_allocations)
                : monthlySettings.income_allocations;
            } catch (e) {}
          }

          if (Object.keys(parsedAllocations).length === 0 && profile?.income_allocations) {
            try {
              parsedAllocations = typeof profile.income_allocations === 'string'
                ? JSON.parse(profile.income_allocations)
                : profile.income_allocations;
            } catch (e) {}
          }
          const incomeTarget = monthlySettings?.total_budget || existingSettings.monthlyIncomeTarget || 0;
          if (Object.keys(parsedAllocations).length === 0 && incomeTarget > 0 && mappedBudgets.length > 0) {
            mappedBudgets.forEach((b) => {
              if (b.amount > 0 && b.categoryId) {
                const pct = Math.round((b.amount / incomeTarget) * 100);
                if (pct > 0) {
                  parsedAllocations[b.categoryId] = pct;
                }
              }
            });
          }

          const mappedSettings: UserSettings = {
            ...existingSettings,
            userName: profile?.full_name || existingSettings.userName || 'User',
            avatarUrl: profile?.avatar_url || existingSettings.avatarUrl || '',
            currency: profile?.currency || existingSettings.currency || 'INR',
            isDarkMode: profile?.is_dark_mode !== false,
            monthlyIncome: monthlySettings?.total_budget || existingSettings.monthlyIncome || 0,
            monthlyIncomeTarget: monthlySettings?.total_budget || existingSettings.monthlyIncomeTarget || 0,
            safetyBufferPercent: monthlySettings?.safety_buffer_percent || existingSettings.safetyBufferPercent || 10,
            safetyBufferPercentage: monthlySettings?.safety_buffer_percent || existingSettings.safetyBufferPercent || 10,
            incomeAllocations: parsedAllocations,
          };

          const mappedCategories = (categories || []).map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type,
            isEssential: c.is_essential,
            isPreset: c.is_preset,
          }));

          const mappedTransactions = (transactions || []).map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            categoryId: t.category_id,
            accountId: t.account_id,
            date: t.date,
            note: t.note,
            groupId: t.group_id,
            splitType: t.split_type,
            paidBy: t.paid_by,
            createdAt: t.created_at,
          }));

          const mappedAccounts = (finalAccounts || []).map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            startingBalance: a.starting_balance,
            currentBalance: a.current_balance,
          }));

          const mappedGroups = groups.map((g) => ({
            id: g.id,
            name: g.name,
            type: g.type,
            createdBy: g.created_by,
            createdAt: g.created_at,
          }));

          const mappedGroupMembers = groupMembers.map((gm) => {
            const pData = Array.isArray(gm.profiles) ? gm.profiles[0] : gm.profiles;
            return {
              id: gm.id,
              groupId: gm.group_id,
              userId: gm.user_id,
              role: gm.role,
              joinedAt: gm.joined_at,
              profile: pData ? { email: pData.email, fullName: pData.full_name } : undefined,
            };
          });

          const mappedSplits = splits.map((s) => ({
            id: s.id,
            transactionId: s.transaction_id,
            userId: s.user_id,
            amount: s.amount,
            percentage: s.percentage,
          }));

          const mappedReminders: Reminder[] = (remindersData || []).map((r) => ({
            id: r.id,
            userId: r.user_id,
            title: r.title,
            amount: Number(r.amount) || 0,
            type: r.type || 'bill_payment',
            dueDate: r.due_date,
            categoryId: r.category_id || undefined,
            note: r.note || undefined,
            isCompleted: !!r.is_completed,
            recurringPeriod: r.recurring_period || 'none',
            createdAt: r.created_at || new Date().toISOString(),
          }));

          const pendingReminders = get().syncQueue
            .filter((a) => a.type === 'ADD_REMINDER')
            .map((a) => a.payload.reminderData);

          const finalReminders = [
            ...pendingReminders,
            ...mappedReminders.filter((r) => !pendingReminders.some((p) => p.id === r.id)),
          ];

          set({
            isOffline: false,
            userId,
            settings: mappedSettings,
            categories: mappedCategories,
            accounts: mappedAccounts,
            transactions: mappedTransactions,
            budgets: mappedBudgets,
            reminders: finalReminders,
            groups: mappedGroups,
            groupMembers: mappedGroupMembers,
            splits: mappedSplits,
          });
        } catch (error) {
          console.warn('Network error fetching initial data, retaining local state:', error);
          set({ isOffline: true });
        }
      },

      // Sync Engine
      processSyncQueue: async () => {
        const { isSyncing, syncQueue } = get();
        if (isSyncing || syncQueue.length === 0) return;

        // Synchronously acquire lock to prevent parallel execution race conditions
        set({ isSyncing: true, isOffline: false });

        try {
          const online = await checkIsOnline();
          if (!online) {
            set({ isOffline: true });
            return;
          }

          let currentUserId = get().userId;
          if (!currentUserId) {
            try {
              const { data } = await supabase.auth.getUser();
              currentUserId = data?.user?.id || null;
              if (currentUserId) set({ userId: currentUserId });
            } catch (e) {}
          }

          let currentQueue = [...get().syncQueue];
          const attemptsMap: Record<string, number> = {};

        while (currentQueue.length > 0) {
          const action = currentQueue[0];
          let success = false;

          try {
            switch (action.type) {
              case 'ADD_TRANSACTION': {
                const { txData, tempId, initialSplits } = action.payload;
                const { data, error } = await supabase
                  .from('transactions')
                  .insert({
                    user_id: txData.userId || get().userId,
                    amount: txData.amount,
                    type: txData.type,
                    category_id: txData.categoryId,
                    account_id: txData.accountId,
                    date: txData.date,
                    note: txData.note,
                    group_id: txData.groupId || null,
                    split_type: txData.splitType || 'none',
                    paid_by: txData.paidBy || get().userId,
                  })
                  .select()
                  .single();

                if (!error && data) {
                  const realId = data.id;

                  // Update initial splits if present
                  let syncedSplits: TransactionSplit[] = [];
                  if (initialSplits && initialSplits.length > 0) {
                    const splitPayload = initialSplits.map((s: any) => ({
                      transaction_id: realId,
                      user_id: s.userId,
                      amount: s.amount,
                      percentage: s.percentage,
                    }));
                    const { data: savedSplits } = await supabase
                      .from('transaction_splits')
                      .insert(splitPayload)
                      .select();
                    if (savedSplits) {
                      syncedSplits = savedSplits.map((s) => ({
                        id: s.id,
                        transactionId: s.transaction_id,
                        userId: s.user_id,
                        amount: s.amount,
                        percentage: s.percentage,
                      }));
                    }
                  }

                  // Update store replacing local temp ID with server real ID
                  set((state) => ({
                    transactions: state.transactions.map((t) =>
                      t.id === tempId ? { ...t, id: realId, createdAt: data.created_at } : t
                    ),
                    splits: [
                      ...state.splits.filter((s) => s.transactionId !== tempId),
                      ...syncedSplits,
                    ],
                  }));

                  // Sync account balance update
                  const account = get().accounts.find((a) => a.id === txData.accountId);
                  if (account) {
                    await supabase
                      .from('accounts')
                      .update({ current_balance: account.currentBalance })
                      .eq('id', account.id);
                  }
                  success = true;
                }
                break;
              }

              case 'UPDATE_TRANSACTION': {
                const { id, txData } = action.payload;
                const updatePayload: any = {};
                if (txData.amount !== undefined) updatePayload.amount = txData.amount;
                if (txData.type !== undefined) updatePayload.type = txData.type;
                if (txData.categoryId !== undefined) updatePayload.category_id = txData.categoryId;
                if (txData.accountId !== undefined) updatePayload.account_id = txData.accountId;
                if (txData.date !== undefined) updatePayload.date = txData.date;
                if (txData.note !== undefined) updatePayload.note = txData.note;

                const { error } = await supabase
                  .from('transactions')
                  .update(updatePayload)
                  .eq('id', id);

                if (!error) {
                  const account = get().accounts.find((a) => a.id === txData.accountId);
                  if (account) {
                    await supabase
                      .from('accounts')
                      .update({ current_balance: account.currentBalance })
                      .eq('id', account.id);
                  }
                  success = true;
                }
                break;
              }

              case 'DELETE_TRANSACTION': {
                const { id, accountId, accountBalance } = action.payload;
                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (!error) {
                  if (accountId) {
                    await supabase
                      .from('accounts')
                      .update({ current_balance: accountBalance })
                      .eq('id', accountId);
                  }
                  success = true;
                }
                break;
              }

              case 'ADD_CATEGORY': {
                const { categoryData, tempId } = action.payload;
                const userId = get().userId;
                const { data, error } = await supabase
                  .from('categories')
                  .insert({
                    user_id: userId,
                    name: categoryData.name,
                    icon: categoryData.icon,
                    color: categoryData.color,
                    type: categoryData.type,
                    is_essential: categoryData.isEssential,
                    is_preset: false,
                  })
                  .select()
                  .single();

                if (!error && data) {
                  set((state) => ({
                    categories: state.categories.map((c) =>
                      c.id === tempId ? { ...c, id: data.id } : c
                    ),
                  }));
                  success = true;
                }
                break;
              }

              case 'UPDATE_CATEGORY': {
                const { id, categoryData } = action.payload;
                const { error } = await supabase
                  .from('categories')
                  .update({
                    name: categoryData.name,
                    icon: categoryData.icon,
                    color: categoryData.color,
                    type: categoryData.type,
                    is_essential: categoryData.isEssential,
                  })
                  .eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'DELETE_CATEGORY': {
                const { id } = action.payload;
                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'SET_BUDGET': {
                const { categoryId, amount, month } = action.payload;
                const userId = get().userId;
                const fullDateMonth = month.length === 7 ? `${month}-01` : month;
                const { error } = await supabase.from('budgets').upsert(
                  {
                    user_id: userId,
                    category_id: categoryId,
                    month: fullDateMonth,
                    amount: amount,
                  },
                  { onConflict: 'user_id, category_id, month' }
                );
                if (!error) success = true;
                break;
              }

              case 'UPDATE_BUDGET': {
                const { id, amount } = action.payload;
                const { error } = await supabase.from('budgets').update({ amount }).eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'ADD_ACCOUNT': {
                const { accountData, tempId } = action.payload;
                const userId = get().userId;
                const { data, error } = await supabase
                  .from('accounts')
                  .insert({
                    user_id: userId,
                    name: accountData.name,
                    type: accountData.type,
                    starting_balance: accountData.startingBalance,
                    current_balance: accountData.currentBalance,
                  })
                  .select()
                  .single();

                if (!error && data) {
                  set((state) => ({
                    accounts: state.accounts.map((a) =>
                      a.id === tempId ? { ...a, id: data.id } : a
                    ),
                  }));
                  success = true;
                }
                break;
              }

              case 'UPDATE_ACCOUNT': {
                const { id, accountData } = action.payload;
                const { error } = await supabase
                  .from('accounts')
                  .update({
                    name: accountData.name,
                    type: accountData.type,
                    current_balance: accountData.currentBalance,
                  })
                  .eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'DELETE_ACCOUNT': {
                const { id } = action.payload;
                const { error } = await supabase.from('accounts').delete().eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'CREATE_GROUP': {
                const { name, type, tempId } = action.payload;
                const userId = get().userId;
                const { data: newGroup, error } = await supabase
                  .from('groups')
                  .insert({ name, type, created_by: userId })
                  .select()
                  .single();

                if (!error && newGroup) {
                  await supabase.from('group_members').insert({
                    group_id: newGroup.id,
                    user_id: userId,
                    role: 'admin',
                  });

                  set((state) => ({
                    groups: state.groups.map((g) =>
                      g.id === tempId
                        ? { ...g, id: newGroup.id, createdAt: newGroup.created_at }
                        : g
                    ),
                  }));
                  success = true;
                }
                break;
              }

              case 'UPDATE_GROUP': {
                const { id, name } = action.payload;
                const { error } = await supabase.from('groups').update({ name }).eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'DELETE_GROUP': {
                const { id } = action.payload;
                const { error } = await supabase.from('groups').delete().eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'UPDATE_SETTINGS': {
                const { newSettings, userId } = action.payload;
                const uid = userId || get().userId;

                const profileUpdates: any = {};
                if (newSettings.userName !== undefined)
                  profileUpdates.full_name = newSettings.userName;
                if (newSettings.currency !== undefined)
                  profileUpdates.currency = newSettings.currency;
                if (newSettings.isDarkMode !== undefined)
                  profileUpdates.is_dark_mode = newSettings.isDarkMode;
                if (newSettings.incomeAllocations !== undefined)
                  profileUpdates.income_allocations = JSON.stringify(newSettings.incomeAllocations);

                if (Object.keys(profileUpdates).length > 0 && uid) {
                  try {
                    await supabase.from('profiles').update(profileUpdates).eq('id', uid);
                  } catch (e) {
                    // Fail silently if column does not exist on profiles table
                  }
                }

                if (
                  (newSettings.monthlyIncome !== undefined ||
                    newSettings.safetyBufferPercent !== undefined ||
                    newSettings.incomeAllocations !== undefined) &&
                  uid
                ) {
                  const currentMonth = `${new Date().getFullYear()}-${String(
                    new Date().getMonth() + 1
                  ).padStart(2, '0')}-01`;
                  const currentTotal =
                    newSettings.monthlyIncome !== undefined
                      ? newSettings.monthlyIncome
                      : get().settings.monthlyIncome;
                  const currentBuffer =
                    newSettings.safetyBufferPercent !== undefined
                      ? newSettings.safetyBufferPercent
                      : get().settings.safetyBufferPercent;
                  const currentAllocations =
                    newSettings.incomeAllocations !== undefined
                      ? newSettings.incomeAllocations
                      : get().settings.incomeAllocations;

                  const payload: any = {
                    user_id: uid,
                    month: currentMonth,
                    total_budget: currentTotal,
                    safety_buffer_percent: currentBuffer,
                    income_allocations: JSON.stringify(currentAllocations),
                  };

                  try {
                    await supabase.from('monthly_budget_settings').upsert(
                      payload,
                      { onConflict: 'user_id, month' }
                    );
                  } catch (e) {
                    delete payload.income_allocations;
                    await supabase.from('monthly_budget_settings').upsert(
                      payload,
                      { onConflict: 'user_id, month' }
                    );
                  }
                }
                success = true;
                break;
              }

              case 'ADD_REMINDER': {
                const { reminderData, tempId } = action.payload;
                let userId = reminderData?.userId || get().userId;
                if (!userId) {
                  try {
                    const { data: authData } = await supabase.auth.getUser();
                    userId = authData?.user?.id || null;
                  } catch (e) {}
                }

                if (!userId) {
                  success = true;
                  break;
                }

                const catId = reminderData.categoryId && !reminderData.categoryId.startsWith('cat-') ? reminderData.categoryId : null;

                const payload: any = {
                  user_id: userId,
                  title: reminderData.title,
                  amount: Number(reminderData.amount) || 0,
                  type: reminderData.type || 'bill_payment',
                  due_date: reminderData.dueDate || new Date().toISOString().split('T')[0],
                  note: reminderData.note || null,
                  is_completed: !!reminderData.isCompleted,
                  recurring_period: reminderData.recurringPeriod || 'none',
                };
                if (catId) payload.category_id = catId;

                let { data, error } = await supabase
                  .from('reminders')
                  .insert(payload)
                  .select()
                  .single();

                if (error) {
                  delete payload.category_id;
                  const fallback = await supabase
                    .from('reminders')
                    .insert(payload)
                    .select()
                    .single();
                  data = fallback.data;
                  error = fallback.error;
                }

                if (data) {
                  set((state) => ({
                    reminders: state.reminders.map((r) =>
                      r.id === tempId ? { ...r, id: data.id, userId: data.user_id } : r
                    ),
                  }));
                }
                success = true;
                break;
              }

              case 'UPDATE_REMINDER': {
                const { id, updates } = action.payload;
                const payload: any = {};
                if (updates.title !== undefined) payload.title = updates.title;
                if (updates.amount !== undefined) payload.amount = updates.amount;
                if (updates.type !== undefined) payload.type = updates.type;
                if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
                if (updates.categoryId !== undefined) {
                  payload.category_id = updates.categoryId && !updates.categoryId.startsWith('cat-') ? updates.categoryId : null;
                }
                if (updates.note !== undefined) payload.note = updates.note;
                if (updates.isCompleted !== undefined) payload.is_completed = updates.isCompleted;
                if (updates.recurringPeriod !== undefined) payload.recurring_period = updates.recurringPeriod;

                const { error } = await supabase.from('reminders').update(payload).eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'DELETE_REMINDER': {
                const { id } = action.payload;
                const { error } = await supabase.from('reminders').delete().eq('id', id);
                if (!error) success = true;
                break;
              }

              case 'UPDATE_SETTINGS': {
                const { newSettings, userId: actionUserId } = action.payload;
                const targetUserId = actionUserId || get().userId;
                if (targetUserId) {
                  const profilePayload: any = {};
                  if (newSettings.userName !== undefined) profilePayload.full_name = newSettings.userName;
                  if (newSettings.avatarUrl !== undefined) profilePayload.avatar_url = newSettings.avatarUrl;
                  if (newSettings.currency !== undefined) profilePayload.currency = newSettings.currency;
                  if (newSettings.isDarkMode !== undefined) profilePayload.is_dark_mode = newSettings.isDarkMode;

                  if (Object.keys(profilePayload).length > 0) {
                    await supabase.from('profiles').update(profilePayload).eq('id', targetUserId);
                  }
                }
                success = true;
                break;
              }

              default:
                success = true;
                break;
            }
          } catch (err) {
            console.warn('Sync action failed:', action.type, err);
          }

          if (success) {
            currentQueue = currentQueue.slice(1);
            set({ syncQueue: currentQueue });
          } else {
            const actionId = action.id || String(action.timestamp);
            const count = (attemptsMap[actionId] || 0) + 1;
            attemptsMap[actionId] = count;

            if (count >= 2) {
              console.warn('Discarding stuck sync action after 2 failed attempts:', action.type);
              currentQueue = currentQueue.slice(1);
              set({ syncQueue: currentQueue });
            } else {
              break;
            }
          }
        }
        } finally {
          set({ isSyncing: false });
        }
      },

      // --- Transactions ---
      addTransaction: async (txData, initialSplits) => {
        const userId = get().userId;
        if (!userId) return null;

        const tempId = generateTempId('tx');
        const newTx: Transaction = {
          id: tempId,
          amount: txData.amount,
          type: txData.type,
          categoryId: txData.categoryId,
          accountId: txData.accountId,
          date: txData.date,
          note: txData.note,
          groupId: txData.groupId,
          splitType: txData.splitType || 'none',
          paidBy: txData.paidBy || userId,
          createdAt: new Date().toISOString(),
        };

        let newSplits: TransactionSplit[] = [];
        if (initialSplits && initialSplits.length > 0) {
          newSplits = initialSplits.map((s) => ({
            id: generateTempId('split'),
            transactionId: tempId,
            userId: s.userId,
            amount: s.amount,
            percentage: s.percentage,
          }));
        }

        // Optimistically update store
        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === newTx.accountId) {
              const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + delta };
            }
            return acc;
          });

          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'ADD_TRANSACTION',
            payload: { txData: { ...txData, userId }, tempId, initialSplits },
            timestamp: Date.now(),
          };

          return {
            transactions: [newTx, ...state.transactions],
            accounts: updatedAccounts,
            splits: [...state.splits, ...newSplits],
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        // Trigger instant notification for split/shared bills
        if ((initialSplits && initialSplits.length > 0) || (newTx.groupId && newTx.splitType !== 'none')) {
          const symbol = get().settings.currency || '₹';
          sendInstantPushNotification(
            '💸 New Split Expense Added',
            `A split bill "${newTx.note || 'Shared Expense'}" (${symbol}${newTx.amount}) has been recorded.`
          );
        }

        // Trigger sync processing
        get().processSyncQueue();

        return newTx;
      },

      updateTransaction: async (id, txData) => {
        const oldTx = get().transactions.find((t) => t.id === id);
        if (!oldTx) return;

        // Optimistically update store
        set((state) => {
          let updatedAccounts = [...state.accounts];
          updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === oldTx.accountId) {
              const reverseDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + reverseDelta };
            }
            return acc;
          });

          const updatedTx: Transaction = { ...oldTx, ...txData };
          updatedAccounts = updatedAccounts.map((acc) => {
            if (acc.id === updatedTx.accountId) {
              const newDelta = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;
              return { ...acc, currentBalance: acc.currentBalance + newDelta };
            }
            return acc;
          });

          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_TRANSACTION',
            payload: { id, txData },
            timestamp: Date.now(),
          };

          return {
            transactions: state.transactions.map((t) => (t.id === id ? updatedTx : t)),
            accounts: updatedAccounts,
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      deleteTransaction: async (id) => {
        const target = get().transactions.find((t) => t.id === id);
        if (!target) return;

        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === target.accountId) {
              const reverseDelta = target.type === 'income' ? -target.amount : target.amount;
              return { ...acc, currentBalance: acc.currentBalance + reverseDelta };
            }
            return acc;
          });

          const account = updatedAccounts.find((a) => a.id === target.accountId);

          // Clean pending ADD_TRANSACTION from syncQueue if this was a temp ID
          let updatedQueue = state.syncQueue.filter((action) => {
            if (action.type === 'ADD_TRANSACTION' && action.payload?.tempId === id) {
              return false;
            }
            return true;
          });

          // Only enqueue DELETE_TRANSACTION if transaction exists on server
          if (!id.startsWith('temp_')) {
            const syncAction: SyncAction = {
              id: generateTempId('sync'),
              type: 'DELETE_TRANSACTION',
              payload: { id, accountId: target.accountId, accountBalance: account?.currentBalance },
              timestamp: Date.now(),
            };
            updatedQueue = [...updatedQueue, syncAction];
          }

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            accounts: updatedAccounts,
            syncQueue: updatedQueue,
          };
        });

        get().processSyncQueue();
      },

      // --- Categories ---
      addCategory: async (categoryData) => {
        const userId = get().userId;
        if (!userId) return null;

        const tempId = generateTempId('cat');
        const newCat: Category = {
          id: tempId,
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          type: categoryData.type,
          isEssential: categoryData.isEssential,
          isPreset: false,
        };

        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'ADD_CATEGORY',
            payload: { categoryData, tempId },
            timestamp: Date.now(),
          };
          return {
            categories: [...state.categories, newCat],
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
        return newCat;
      },

      updateCategory: async (id, categoryData) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_CATEGORY',
            payload: { id, categoryData },
            timestamp: Date.now(),
          };

          return {
            categories: state.categories.map((c) =>
              c.id === id ? { ...c, ...categoryData } : c
            ),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      createCategory: async (category) => {
        await get().addCategory({
          name: category.name || 'New Category',
          icon: category.icon || 'folder',
          color: category.color || '#3B82F6',
          type: category.type || 'expense',
          isEssential: category.isEssential || false,
          isPreset: category.isPreset || false,
        });
      },

      deleteCategory: async (id) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'DELETE_CATEGORY',
            payload: { id },
            timestamp: Date.now(),
          };

          return {
            categories: state.categories.filter((c) => c.id !== id),
            budgets: state.budgets.filter((b) => b.categoryId !== id),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      // --- Budgets ---
      setBudget: async (categoryId, amount, month) => {
        const userId = get().userId;
        if (!userId) return;

        const fullDateMonth = month.length === 7 ? `${month}-01` : month;

        set((state) => {
          const existing = state.budgets.find(
            (b) => b.categoryId === categoryId && b.month === month
          );
          let newBudgets: Budget[];

          if (existing) {
            newBudgets = state.budgets.map((b) =>
              b.id === existing.id ? { ...b, amount } : b
            );
          } else {
            newBudgets = [
              ...state.budgets,
              { id: generateTempId('bdg'), categoryId, month: fullDateMonth, amount, rollover: false },
            ];
          }

          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'SET_BUDGET',
            payload: { categoryId, amount, month: fullDateMonth },
            timestamp: Date.now(),
          };

          return {
            budgets: newBudgets,
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      updateBudget: async (id, amount) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_BUDGET',
            payload: { id, amount },
            timestamp: Date.now(),
          };

          return {
            budgets: state.budgets.map((b) => (b.id === id ? { ...b, amount } : b)),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      // --- Accounts ---
      addAccount: async (accountData) => {
        const userId = get().userId;
        if (!userId) return null;

        const tempId = generateTempId('acc');
        const newAccount: Account = {
          id: tempId,
          name: accountData.name,
          type: accountData.type,
          startingBalance: accountData.startingBalance,
          currentBalance: accountData.currentBalance,
        };

        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'ADD_ACCOUNT',
            payload: { accountData, tempId },
            timestamp: Date.now(),
          };

          return {
            accounts: [...state.accounts, newAccount],
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
        return newAccount;
      },

      updateAccount: async (id, accountData) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_ACCOUNT',
            payload: { id, accountData },
            timestamp: Date.now(),
          };

          return {
            accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...accountData } : a)),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      deleteAccount: async (id) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'DELETE_ACCOUNT',
            payload: { id },
            timestamp: Date.now(),
          };

          return {
            accounts: state.accounts.filter((a) => a.id !== id),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      // --- Groups ---
      createGroup: async (name, type) => {
        const userId = get().userId;
        if (!userId) return null;

        const tempId = generateTempId('grp');
        const mappedGroup: Group = {
          id: tempId,
          name,
          type,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'CREATE_GROUP',
            payload: { name, type, tempId },
            timestamp: Date.now(),
          };

          return {
            groups: [...state.groups, mappedGroup],
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
        return mappedGroup;
      },

      addMemberToGroup: async (groupId, email, role) => {
        const online = await checkIsOnline();
        if (!online) {
          showGlassAlert('Offline Mode', 'Adding members requires an active internet connection.', undefined, 'warning');
          return false;
        }

        const { data: targetUserId, error: rpcError } = await supabase.rpc(
          'get_user_id_by_email',
          { lookup_email: email }
        );

        if (rpcError || !targetUserId) {
          showGlassAlert('User Not Found', 'Could not find a registered user with that email.', undefined, 'error');
          return false;
        }

        const { data: newMember, error } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: targetUserId,
            role: role,
          })
          .select('*, profiles(email, full_name)')
          .single();

        if (error || !newMember) {
          showGlassAlert('Error Adding Member', error?.message || 'Unknown error', undefined, 'error');
          return false;
        }

        const pData = newMember.profiles
          ? Array.isArray(newMember.profiles)
            ? newMember.profiles[0]
            : newMember.profiles
          : null;

        set((state) => ({
          groupMembers: [
            ...state.groupMembers,
            {
              id: newMember.id,
              groupId: newMember.group_id,
              userId: newMember.user_id,
              role: newMember.role,
              joinedAt: newMember.joined_at,
              profile: pData ? { email: pData.email, fullName: pData.full_name } : undefined,
            },
          ],
        }));

        return true;
      },

      updateGroup: async (id, name) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_GROUP',
            payload: { id, name },
            timestamp: Date.now(),
          };

          return {
            groups: state.groups.map((g) => (g.id === id ? { ...g, name } : g)),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      deleteGroup: async (id) => {
        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'DELETE_GROUP',
            payload: { id },
            timestamp: Date.now(),
          };

          return {
            groups: state.groups.filter((g) => g.id !== id),
            groupMembers: state.groupMembers.filter((m) => m.groupId !== id),
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      removeMemberFromGroup: async (memberId) => {
        set((state) => ({
          groupMembers: state.groupMembers.filter((m) => m.id !== memberId),
        }));

        const online = await checkIsOnline();
        if (online) {
          await supabase.from('group_members').delete().eq('id', memberId);
        }
      },

      // --- Custom Reminders ---
      addReminder: async (reminderData) => {
        let userId = get().userId;
        if (!userId) {
          try {
            const { data } = await supabase.auth.getUser();
            userId = data?.user?.id || null;
            if (userId) set({ userId });
          } catch (e) {}
        }

        const tempId = generateTempId('rem');
        const notifId = await scheduleReminderNotification({ ...reminderData, id: tempId, isCompleted: false, createdAt: '' });
        const newReminder: Reminder = {
          ...reminderData,
          id: tempId,
          userId: userId || undefined,
          isCompleted: false,
          notificationId: notifId || undefined,
          createdAt: new Date().toISOString(),
        };

        const syncAction: SyncAction = {
          id: generateTempId('sync'),
          type: 'ADD_REMINDER',
          payload: { reminderData: { ...newReminder, userId }, tempId },
          timestamp: Date.now(),
        };

        set((state) => ({
          reminders: [newReminder, ...state.reminders],
          syncQueue: [...state.syncQueue, syncAction],
        }));

        get().processSyncQueue();
        return newReminder;
      },

      updateReminder: async (id, updates) => {
        const syncAction: SyncAction = {
          id: generateTempId('sync'),
          type: 'UPDATE_REMINDER',
          payload: { id, updates },
          timestamp: Date.now(),
        };

        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          syncQueue: [...state.syncQueue, syncAction],
        }));

        get().processSyncQueue();
      },

      deleteReminder: async (id) => {
        const target = get().reminders.find((r) => r.id === id);
        if (target?.notificationId) {
          await cancelReminderNotification(target.notificationId);
        }

        const syncAction: SyncAction = {
          id: generateTempId('sync'),
          type: 'DELETE_REMINDER',
          payload: { id },
          timestamp: Date.now(),
        };

        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
          syncQueue: [...state.syncQueue, syncAction],
        }));

        get().processSyncQueue();
      },

      toggleReminderComplete: async (id, convertToTransaction = false, accountId) => {
        const target = get().reminders.find((r) => r.id === id);
        if (!target) return;

        const newCompleted = !target.isCompleted;
        if (newCompleted && target.notificationId) {
          await cancelReminderNotification(target.notificationId);
        }

        const calculateNextDueDate = (currentDateStr: string, period: 'weekly' | 'monthly' | 'yearly'): string => {
          const d = new Date(currentDateStr);
          if (isNaN(d.getTime())) return currentDateStr;
          if (period === 'weekly') {
            d.setDate(d.getDate() + 7);
          } else if (period === 'monthly') {
            d.setMonth(d.getMonth() + 1);
          } else if (period === 'yearly') {
            d.setFullYear(d.getFullYear() + 1);
          }
          return d.toISOString().split('T')[0];
        };

        if (newCompleted) {
          if (convertToTransaction && target.amount > 0) {
            const isReceivable = target.type === 'money_receivable';
            const txType: 'income' | 'expense' = isReceivable ? 'income' : 'expense';

            const defaultAccId = accountId || get().accounts[0]?.id;

            // Ensure selected category matches transaction type ('income' vs 'expense')
            let matchedCatId = target.categoryId;
            if (matchedCatId) {
              const cat = get().categories.find((c) => c.id === matchedCatId);
              if (cat && cat.type !== txType) {
                matchedCatId = undefined;
              }
            }

            if (!matchedCatId) {
              const fallbackCat = get().categories.find((c) => c.type === txType);
              matchedCatId = fallbackCat?.id || get().categories[0]?.id;
            }

            if (defaultAccId && matchedCatId) {
              await get().addTransaction({
                amount: target.amount,
                type: txType,
                categoryId: matchedCatId,
                accountId: defaultAccId,
                date: new Date().toISOString().split('T')[0],
                note: `Recorded from reminder: ${target.title}`,
              });
            }
          }

          await get().updateReminder(id, { isCompleted: true });

          // Auto-renew recurring reminder for the next period when completed
          if (target.recurringPeriod && target.recurringPeriod !== 'none') {
            const nextDueDate = calculateNextDueDate(target.dueDate, target.recurringPeriod);

            const existingNextCycle = get().reminders.find(
              (r) =>
                r.title.trim().toLowerCase() === target.title.trim().toLowerCase() &&
                r.type === target.type &&
                r.dueDate === nextDueDate
            );

            if (!existingNextCycle) {
              await get().addReminder({
                title: target.title,
                amount: target.amount,
                type: target.type,
                dueDate: nextDueDate,
                categoryId: target.categoryId,
                note: target.note,
                recurringPeriod: target.recurringPeriod,
              });
            }
          }
        } else {
          // Unchecking / Marking UNCOMPLETED
          await get().updateReminder(id, { isCompleted: false });

          // Clean up the auto-generated future cycle entry if it hasn't been completed yet
          if (target.recurringPeriod && target.recurringPeriod !== 'none') {
            const nextDueDate = calculateNextDueDate(target.dueDate, target.recurringPeriod);

            const futureAutoEntry = get().reminders.find(
              (r) =>
                !r.isCompleted &&
                r.title.trim().toLowerCase() === target.title.trim().toLowerCase() &&
                r.type === target.type &&
                r.dueDate === nextDueDate
            );

            if (futureAutoEntry) {
              await get().deleteReminder(futureAutoEntry.id);
            }
          }
        }
      },

      // --- Settings ---
      updateSettings: async (newSettings) => {
        const userId = get().userId;

        set((state) => {
          const syncAction: SyncAction = {
            id: generateTempId('sync'),
            type: 'UPDATE_SETTINGS',
            payload: { newSettings, userId },
            timestamp: Date.now(),
          };

          return {
            settings: { ...state.settings, ...newSettings },
            syncQueue: [...state.syncQueue, syncAction],
          };
        });

        get().processSyncQueue();
      },

      updateIncomeAllocations: async (allocations, applyToBudgets = true) => {
        await get().updateSettings({ incomeAllocations: allocations });

        if (applyToBudgets) {
          const { settings, categories, setBudget } = get();
          const income = settings.monthlyIncomeTarget || settings.monthlyIncome || 0;
          const currentMonth = new Date().toISOString().slice(0, 7);

          if (income > 0) {
            for (const [catId, pct] of Object.entries(allocations)) {
              const cat = categories.find((c) => c.id === catId);
              if (cat && cat.type === 'expense') {
                const calculatedAmount = Math.round((income * (pct / 100)));
                await setBudget(catId, calculatedAmount, currentMonth);
              }
            }
          }
        }
      },

      applyPresetAllocations: async (preset) => {
        const categories = get().categories.filter((c) => c.type === 'expense');
        if (categories.length === 0) return;

        const allocations: Record<string, number> = {};

        if (preset === '50/30/20' || preset === '60/20/20') {
          const is503020 = preset === '50/30/20';
          const targetNeeds = is503020 ? 50 : 60;
          const targetWants = 20;
          const targetSavings = 20;

          const essentialCats = categories.filter((c) => c.isEssential);
          const discretionaryCats = categories.filter((c) => !c.isEssential && !c.name.toLowerCase().includes('sav') && !c.name.toLowerCase().includes('invest'));
          const savingsCats = categories.filter((c) => c.name.toLowerCase().includes('sav') || c.name.toLowerCase().includes('invest'));

          const essentialShare = essentialCats.length > 0 ? Math.floor(targetNeeds / essentialCats.length) : 0;
          const discretionaryShare = discretionaryCats.length > 0 ? Math.floor(targetWants / discretionaryCats.length) : 0;
          const savingsShare = savingsCats.length > 0 ? Math.floor(targetSavings / savingsCats.length) : 0;

          essentialCats.forEach((c) => { allocations[c.id] = essentialShare; });
          discretionaryCats.forEach((c) => { allocations[c.id] = discretionaryShare; });
          savingsCats.forEach((c) => { allocations[c.id] = savingsShare; });
        } else if (preset === 'equal') {
          const share = Math.floor(100 / categories.length);
          categories.forEach((c) => { allocations[c.id] = share; });
        }

        await get().updateIncomeAllocations(allocations, true);
      },

      setCurrency: async (currency) => {
        get().updateSettings({ currency });
      },

      toggleDarkMode: async () => {
        get().updateSettings({ isDarkMode: !get().settings.isDarkMode });
      },

      resetToDefaults: async () => {
        const userId = get().userId;
        if (!userId) return;

        const online = await checkIsOnline();
        if (online) {
          try {
            await Promise.all([
              supabase.from('transactions').delete().eq('user_id', userId),
              supabase.from('budgets').delete().eq('user_id', userId),
              supabase.from('monthly_budgets').delete().eq('user_id', userId),
              supabase.from('accounts').delete().eq('user_id', userId),
              supabase.from('reminders').delete().eq('user_id', userId),
              supabase
                .from('categories')
                .delete()
                .eq('user_id', userId)
                .eq('is_preset', false),
              supabase
                .from('profiles')
                .update({ income_allocations: {}, monthly_income_target: 0 })
                .eq('id', userId),
            ]);
          } catch (e) {}

          set({
            transactions: [],
            budgets: [],
            accounts: [],
            reminders: [],
            splits: [],
            settings: DEFAULT_SETTINGS,
            syncQueue: [],
          });
          await get().fetchInitialData(userId);
        } else {
          set({
            transactions: [],
            budgets: [],
            accounts: [],
            reminders: [],
            splits: [],
            settings: DEFAULT_SETTINGS,
            categories: get().categories.filter((c) => c.isPreset),
            syncQueue: [],
          });
        }
      },

      // --- Selectors ---

      getTransactionsByCategory: (categoryId) => {
        return get().transactions.filter((t) => t.categoryId === categoryId);
      },

      getCategorySpend: (categoryId, month) => {
        const state = get();
        const currentMonth =
          month ||
          `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        return state.transactions
          .filter(
            (t) =>
              t.categoryId === categoryId &&
              t.type === 'expense' &&
              t.date &&
              t.date.startsWith(currentMonth)
          )
          .reduce((sum, t) => {
            let personalAmount = Number(t.amount) || 0;
            if (t.groupId && t.splitType !== 'none' && state.userId) {
              const txSplits = state.splits.filter((s) => s.transactionId === t.id);
              if (txSplits.length > 0) {
                const mySplit = txSplits.find((s) => s.userId === state.userId);
                personalAmount = mySplit ? Number(mySplit.amount) || 0 : 0;
              }
            }
            return sum + personalAmount;
          }, 0);
      },
    }),
    {
      name: 'guilt-free-expense-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets,
        accounts: state.accounts,
        settings: state.settings,
        reminders: state.reminders,
        groups: state.groups,
        groupMembers: state.groupMembers,
        splits: state.splits,
        syncQueue: state.syncQueue,
        isOffline: state.isOffline,
      }),
    }
  )
);

// Subscribe to network connectivity changes to automatically switch modes & flush sync queue when internet returns
subscribeToNetworkStatus((online) => {
  const store = useExpenseStore.getState();
  if (online) {
    useExpenseStore.setState({ isOffline: false });
    if (store.syncQueue.length > 0 && !store.isSyncing) {
      store.processSyncQueue();
    }
  } else {
    useExpenseStore.setState({ isOffline: true });
  }
});
