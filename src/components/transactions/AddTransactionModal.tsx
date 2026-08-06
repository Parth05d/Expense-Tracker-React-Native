import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Trash2, Calendar, Check, ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react-native';
import { Transaction, TransactionType } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { CURRENCY_CONFIGS } from '../../utils/currency';
import { getTodayIsoDate } from '../../utils/dateHelpers';
import { NumberPad } from '../common/NumberPad';
import { Button } from '../common/Button';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  initialTransaction,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currencyCode = useExpenseStore((state) => state.settings.currency);
  const categories = useExpenseStore((state) => state.categories);
  const accounts = useExpenseStore((state) => state.accounts);
  
  const addTransaction = useExpenseStore((state) => state.addTransaction);
  const updateTransaction = useExpenseStore((state) => state.updateTransaction);
  const deleteTransaction = useExpenseStore((state) => state.deleteTransaction);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currencySymbol = CURRENCY_CONFIGS[currencyCode]?.symbol || '₹';

  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayIsoDate());
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'keypad' | 'details'>('keypad');

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(String(initialTransaction.amount));
        setSelectedCategoryId(initialTransaction.categoryId);
        setSelectedAccountId(initialTransaction.accountId);
        setDate(initialTransaction.date);
        setNote(initialTransaction.note || '');
        setIsRecurring(!!initialTransaction.isRecurring);
        setActiveTab('keypad');
      } else {
        setType('expense');
        setAmountStr('0');
        const defaultCat = categories.find((c) => c.type === 'expense');
        setSelectedCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || ''));
        setSelectedAccountId(accounts[0]?.id || '');
        setDate(getTodayIsoDate());
        setNote('');
        setIsRecurring(false);
        setActiveTab('keypad');
      }
    }
  }, [visible, initialTransaction, categories, accounts]);

  // Keypad Handlers
  const handleDigitPress = (digit: string) => {
    if (digit === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => (prev === '0' ? '0.' : prev + '.'));
      }
      return;
    }

    if (amountStr === '0') {
      setAmountStr(digit);
    } else {
      // Limit to 2 decimal places if dot present
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) {
        return;
      }
      if (amountStr.length < 10) {
        setAmountStr((prev) => prev + digit);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  // Filter categories by selected type (income/expense)
  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSave = () => {
    const numericAmount = parseFloat(amountStr);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an amount greater than 0.');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Select Category', 'Please choose a category.');
      return;
    }

    if (!selectedAccountId) {
      Alert.alert('Select Account', 'Please choose a payment account.');
      return;
    }

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        amount: numericAmount,
        type,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        date,
        note: note.trim() || undefined,
        isRecurring,
      });
    } else {
      addTransaction({
        amount: numericAmount,
        type,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        date,
        note: note.trim() || undefined,
        isRecurring,
        paymentMethod: accounts.find((a) => a.id === selectedAccountId)?.name,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (!initialTransaction) return;

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(initialTransaction.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            {initialTransaction ? (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 size={20} color={theme.destructive} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            {/* Income / Expense Toggle Pill */}
            <View style={[styles.typePillContainer, { backgroundColor: theme.secondary }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setType('expense');
                  const cat = categories.find((c) => c.type === 'expense');
                  if (cat) setSelectedCategoryId(cat.id);
                }}
                style={[
                  styles.typePill,
                  type === 'expense' && { backgroundColor: theme.surface, shadowOpacity: 0.1 },
                ]}
              >
                <ArrowDownLeft
                  size={14}
                  color={type === 'expense' ? theme.destructive : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typePillText,
                    { color: type === 'expense' ? theme.text : theme.textMuted },
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setType('income');
                  const cat = categories.find((c) => c.type === 'income');
                  if (cat) setSelectedCategoryId(cat.id);
                }}
                style={[
                  styles.typePill,
                  type === 'income' && { backgroundColor: theme.surface, shadowOpacity: 0.1 },
                ]}
              >
                <ArrowUpRight
                  size={14}
                  color={type === 'income' ? theme.primary : theme.textMuted}
                />
                <Text
                  style={[
                    styles.typePillText,
                    { color: type === 'income' ? theme.text : theme.textMuted },
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.secondary }]}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textMuted }]}>
              Amount
            </Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currencyPrefix, { color: type === 'income' ? theme.primary : theme.text }]}>
                {currencySymbol}
              </Text>
              <Text
                style={[
                  styles.amountValue,
                  { color: type === 'income' ? theme.primary : theme.text },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {amountStr}
              </Text>
            </View>
          </View>

          {/* Category Selector Carousel */}
          <View style={styles.categoriesWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: isSelected ? `${cat.color}25` : theme.secondary,
                        borderColor: isSelected ? cat.color : 'transparent',
                      },
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.categoryName,
                        { color: isSelected ? theme.text : theme.textMuted },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Note Input & Account Selector */}
          <View style={styles.detailsRow}>
            {/* Account Picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScroll}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: isSelected ? theme.primaryDim : theme.secondary,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountChipText,
                        { color: isSelected ? theme.primary : theme.textMuted },
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Note Input */}
          <View style={styles.noteContainer}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note or merchant (e.g. Starbucks)..."
              placeholderTextColor={theme.textDim}
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.secondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
          </View>

          {/* NumberPad */}
          <View style={styles.numberPadWrapper}>
            <NumberPad
              onPressDigit={handleDigitPress}
              onDelete={handleDeleteDigit}
              onClear={handleClear}
            />
          </View>

          {/* Save Button */}
          <View style={styles.footer}>
            <Button
              title={initialTransaction ? 'Update Transaction' : 'Save Transaction'}
              onPress={handleSave}
              size="lg"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.round,
    padding: 3,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  categoriesWrapper: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minWidth: 70,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsRow: {
    marginBottom: Spacing.sm,
  },
  accountScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noteInput: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
  },
  numberPadWrapper: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
});
