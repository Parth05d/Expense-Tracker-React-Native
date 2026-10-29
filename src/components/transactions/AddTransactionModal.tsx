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
import { X, Trash2, ArrowDownLeft, ArrowUpRight, Percent, Equal, DollarSign } from 'lucide-react-native';
import { Transaction, TransactionType, TransactionSplit } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { CURRENCY_CONFIGS } from '../../utils/currency';
import { getTodayIsoDate } from '../../utils/dateHelpers';
import { NumberPad } from '../common/NumberPad';
import { Button } from '../common/Button';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { showGlassAlert } from '../common/GlassAlert';

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
  const groups = useExpenseStore((state) => state.groups);
  const groupMembers = useExpenseStore((state) => state.groupMembers);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);
  
  const addTransaction = useExpenseStore((state) => state.addTransaction);
  const updateTransaction = useExpenseStore((state) => state.updateTransaction);
  const deleteTransaction = useExpenseStore((state) => state.deleteTransaction);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currencySymbol = CURRENCY_CONFIGS[currencyCode]?.symbol || '$';

  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayIsoDate());
  const [note, setNote] = useState<string>('');
  
  // Split logic
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<'none' | 'equal' | 'percentage' | 'custom'>('none');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Create Category Modal State
  const [createCategoryVisible, setCreateCategoryVisible] = useState(false);

  // Payment Method & Card/Bank State
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [bankOrCardName, setBankOrCardName] = useState<string>('');
  const [selectedChip, setSelectedChip] = useState<string>('GPay');
  const [customProviders, setCustomProviders] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmountStr(String(initialTransaction.amount));
        setSelectedCategoryId(initialTransaction.categoryId);
        setSelectedAccountId(initialTransaction.accountId);
        setDate(initialTransaction.date);
        setNote(initialTransaction.note || '');
        setSelectedGroupId(initialTransaction.groupId || null);
        setSplitType(initialTransaction.splitType || 'none');
        
        // Parse existing payment method and bank/card name
        const rawPm = initialTransaction.paymentMethod || 'UPI';
        if (rawPm.includes('(')) {
          const parts = rawPm.split('(');
          const pm = parts[0].trim();
          const sub = parts[1].replace(')', '').trim();
          setPaymentMethod(pm);
          setBankOrCardName(sub);
          setSelectedChip(sub);
        } else {
          setPaymentMethod(rawPm);
          setBankOrCardName('');
          setSelectedChip('GPay');
        }

        const txSplits = splits.filter(s => s.transactionId === initialTransaction.id);
        if (txSplits.length > 0) {
          const splitMap: Record<string, string> = {};
          txSplits.forEach(s => {
            if (initialTransaction.splitType === 'percentage' && s.percentage !== null && s.percentage !== undefined) {
              splitMap[s.userId] = String(s.percentage);
            } else {
              splitMap[s.userId] = String(s.amount);
            }
          });
          setCustomSplits(splitMap);
        } else {
          setCustomSplits({});
        }
      } else {
        setType('expense');
        setAmountStr('0');
        const defaultCat = categories.find((c) => c.type === 'expense');
        setSelectedCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || ''));
        setSelectedAccountId(accounts[0]?.id || '');
        setDate(getTodayIsoDate());
        setNote('');
        setPaymentMethod('UPI');
        setBankOrCardName('');
        setSelectedChip('GPay');
        setSelectedGroupId(null);
        setSplitType('none');
        setCustomSplits({});
      }
    }
  }, [visible, initialTransaction, categories, accounts]);

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
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (amountStr.length < 10) {
        setAmountStr((prev) => prev + digit);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (amountStr.length <= 1) setAmountStr('0');
    else setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleClear = () => setAmountStr('0');

  const filteredCategories = categories.filter((c) => c.type === type);
  const currentMembers = selectedGroupId ? groupMembers.filter(m => m.groupId === selectedGroupId) : [];
  const numericAmount = parseFloat(amountStr) || 0;

  const handleCustomSplitChange = (uId: string, val: string) => {
    setCustomSplits(prev => ({ ...prev, [uId]: val }));
  };

  const validateSplits = (): Omit<TransactionSplit, 'id'|'transactionId'>[] | null => {
    if (!selectedGroupId || splitType === 'none') return [];
    
    if (splitType === 'equal') {
      const perPerson = numericAmount / currentMembers.length;
      return currentMembers.map(m => ({
        userId: m.userId,
        amount: Number(perPerson.toFixed(2))
      }));
    }

    if (splitType === 'percentage') {
      let totalPct = 0;
      const splits: Omit<TransactionSplit, 'id'|'transactionId'>[] = [];
      for (const m of currentMembers) {
        const pct = parseFloat(customSplits[m.userId]) || 0;
        totalPct += pct;
        splits.push({
          userId: m.userId,
          amount: Number(((numericAmount * pct) / 100).toFixed(2)),
          percentage: pct
        });
      }
      if (Math.abs(totalPct - 100) > 0.01) {
        showGlassAlert('Invalid Split', 'Percentages must add up to exactly 100%.', undefined, 'error');
        return null;
      }
      return splits;
    }

    if (splitType === 'custom') {
      let totalAmt = 0;
      const splits: Omit<TransactionSplit, 'id'|'transactionId'>[] = [];
      for (const m of currentMembers) {
        const amt = parseFloat(customSplits[m.userId]) || 0;
        totalAmt += amt;
        splits.push({
          userId: m.userId,
          amount: amt
        });
      }
      if (Math.abs(totalAmt - numericAmount) > 0.01) {
        showGlassAlert('Invalid Split', `Custom amounts must add up to exactly ${currencySymbol}${numericAmount}. Currently at ${currencySymbol}${totalAmt}.`, undefined, 'error');
        return null;
      }
      return splits;
    }

    return [];
  };

  const handleSave = () => {
    if (!numericAmount || numericAmount <= 0) {
      showGlassAlert('Invalid Amount', 'Please enter an amount greater than 0.', undefined, 'error');
      return;
    }
    if (!selectedCategoryId) {
      showGlassAlert('Select Category', 'Please choose a category.', undefined, 'error');
      return;
    }
    if (!selectedAccountId) {
      showGlassAlert('Select Account', 'Please choose a payment account.', undefined, 'error');
      return;
    }

    const calculatedSplits = validateSplits();
    if (calculatedSplits === null) return;

    const fullPaymentMethod = paymentMethod + (bankOrCardName.trim() ? ` (${bankOrCardName.trim()})` : '');

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, {
        amount: numericAmount,
        type,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        date,
        note: note.trim() || undefined,
        paymentMethod: fullPaymentMethod,
        groupId: selectedGroupId || undefined,
        splitType: selectedGroupId ? splitType : 'none',
      });
    } else {
      addTransaction({
        amount: numericAmount,
        type,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
        date,
        note: note.trim() || undefined,
        paymentMethod: fullPaymentMethod,
        groupId: selectedGroupId || undefined,
        splitType: selectedGroupId ? splitType : 'none',
        paidBy: userId || undefined,
      }, calculatedSplits);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!initialTransaction) return;
    showGlassAlert(
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
      ],
      'warning'
    );
  };

  const handleTypeToggle = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setSelectedGroupId(null);
      setSplitType('none');
    }
    const matchingCats = categories.filter((c) => c.type === newType);
    const currentCatObj = categories.find((c) => c.id === selectedCategoryId);
    if (!currentCatObj || currentCatObj.type !== newType) {
      if (matchingCats.length > 0) {
        setSelectedCategoryId(matchingCats[0].id);
      } else {
        setSelectedCategoryId('');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        {/* Frosted Glass Sheet */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
              borderLeftColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              ...ShadowPresets.glass,
            },
          ]}
        >
          {/* Specular Inner Sheen Line */}
          <View style={styles.glassSheenLine} />

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              {initialTransaction ? (
                <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { backgroundColor: theme.destructiveDim }]}>
                  <Trash2 size={18} color={theme.destructive} />
                </TouchableOpacity>
              ) : <View style={{ width: 40 }} />}

              {/* Expense / Income Segmented Switcher */}
              <View style={[styles.typePillContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: theme.border }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTypeToggle('expense')}
                  style={[
                    styles.typePill,
                    type === 'expense' && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                  ]}
                >
                  <ArrowDownLeft size={14} color={type === 'expense' ? '#FFFFFF' : theme.textMuted} />
                  <Text style={[styles.typePillText, { color: type === 'expense' ? '#FFFFFF' : theme.textMuted }]}>Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTypeToggle('income')}
                  style={[
                    styles.typePill,
                    type === 'income' && { backgroundColor: '#10B981', borderColor: '#10B981' },
                  ]}
                >
                  <ArrowUpRight size={14} color={type === 'income' ? '#FFFFFF' : theme.textMuted} />
                  <Text style={[styles.typePillText, { color: type === 'income' ? '#FFFFFF' : theme.textMuted }]}>Income</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Amount Hero Section */}
            <View style={styles.amountContainer}>
              <Text style={[styles.amountLabel, { color: type === 'income' ? '#10B981' : '#EF4444' }]}>
                {type === 'income' ? 'Total Income Amount' : 'Total Expense Amount'}
              </Text>
              <View style={styles.amountRow}>
                <Text style={[styles.currencyPrefix, { color: type === 'income' ? '#10B981' : '#EF4444' }]}>
                  {type === 'income' ? `+ ${currencySymbol}` : currencySymbol}
                </Text>
                <Text style={[styles.amountValue, { color: type === 'income' ? '#10B981' : theme.text }]}>
                  {amountStr}
                </Text>
              </View>
            </View>

          {/* Group Selector */}
          {groups.length > 0 && type === 'expense' && (
            <View style={styles.groupsWrapper}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Assign to Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                <TouchableOpacity
                  onPress={() => { setSelectedGroupId(null); setSplitType('none'); }}
                  style={[
                    styles.groupItem,
                    {
                      backgroundColor: !selectedGroupId ? theme.primaryDim : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      borderColor: !selectedGroupId ? theme.primary : isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                >
                  <Text style={{ color: !selectedGroupId ? theme.primary : theme.textMuted, fontSize: 13, fontWeight: '700' }}>Personal</Text>
                </TouchableOpacity>
                {groups.map((g) => {
                  const isSelected = selectedGroupId === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => { setSelectedGroupId(g.id); setSplitType('equal'); }}
                      style={[
                        styles.groupItem,
                        {
                          backgroundColor: isSelected ? theme.primaryDim : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                          borderColor: isSelected ? theme.primary : isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    >
                      <Text style={{ color: isSelected ? theme.primary : theme.text, fontSize: 13, fontWeight: '700' }}>{g.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

            {/* Split Type Selector */}
            {selectedGroupId && (
              <View style={styles.splitWrapper}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Split Type</Text>
                <View style={styles.splitTabs}>
                  {[
                    { id: 'equal', icon: Equal, label: 'Equal' },
                    { id: 'percentage', icon: Percent, label: 'Percent' },
                    { id: 'custom', icon: DollarSign, label: 'Custom' },
                    { id: 'none', icon: X, label: 'None' },
                  ].map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => setSplitType(st.id as any)}
                      style={[
                        styles.splitTab,
                        { backgroundColor: splitType === st.id ? theme.primary : theme.secondary },
                      ]}
                    >
                      <st.icon size={16} color={splitType === st.id ? '#FFF' : theme.text} />
                      <Text style={{ color: splitType === st.id ? '#FFF' : theme.text, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>{st.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {splitType === 'equal' && (
                  <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
                    Splitting {currencySymbol}{numericAmount} equally among {currentMembers.length} members ({currencySymbol}{(numericAmount/currentMembers.length).toFixed(2)} each).
                  </Text>
                )}
                
                {(splitType === 'percentage' || splitType === 'custom') && (
                  <View style={styles.splitInputsContainer}>
                    {currentMembers.map(m => {
                      const name = m.userId === userId ? 'You' : (m.profile?.fullName || m.profile?.email || 'Unknown');
                      return (
                        <View key={m.id} style={styles.splitInputRow}>
                          <Text style={{ color: theme.text, flex: 1, fontSize: 13, fontWeight: '600' }}>{name}</Text>
                          <View style={[styles.splitInputWrapper, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                            {splitType === 'custom' && <Text style={{ color: theme.textMuted, marginRight: 4 }}>{currencySymbol}</Text>}
                            <TextInput
                              value={customSplits[m.userId] || ''}
                              onChangeText={(val) => handleCustomSplitChange(m.userId, val)}
                              keyboardType="decimal-pad"
                              placeholder="0"
                              placeholderTextColor={theme.textDim}
                              style={{ color: theme.text, fontSize: 15, fontWeight: '700', width: 55, textAlign: 'right' }}
                            />
                            {splitType === 'percentage' && <Text style={{ color: theme.textMuted, marginLeft: 4 }}>%</Text>}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Category Selector */}
            <View style={styles.categoriesWrapper}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                {type === 'income' ? 'Income Category' : 'Expense Category'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                <TouchableOpacity
                  onPress={() => setCreateCategoryVisible(true)}
                  style={[
                    styles.categoryItem,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.15)',
                      borderStyle: 'dashed',
                    },
                  ]}
                >
                  <Text style={styles.categoryIcon}>➕</Text>
                  <Text style={[styles.categoryName, { color: theme.primary }]}>New</Text>
                </TouchableOpacity>

                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.categoryItem,
                        {
                          backgroundColor: isSelected ? `${cat.color}30` : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                          borderColor: isSelected ? cat.color : isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text style={[styles.categoryName, { color: isSelected ? theme.text : theme.textMuted }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Payment / Deposit Account Selector (Excluding Cash) */}
            {(() => {
              const nonCashAccounts = accounts.filter(
                (acc) => acc.name.toLowerCase() !== 'cash' && acc.type !== 'cash'
              );

              if (nonCashAccounts.length === 0) return null;

              return (
                <View style={styles.detailsRow}>
                  <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>
                    {type === 'income' ? 'Deposit To Account' : 'Payment Account'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {nonCashAccounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          onPress={() => setSelectedAccountId(acc.id)}
                          style={[
                            styles.accountChip,
                            {
                              backgroundColor: isSelected ? theme.primaryDim : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                              borderColor: isSelected ? theme.primary : isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                            },
                          ]}
                        >
                          <Text style={[styles.accountChipText, { color: isSelected ? theme.primary : theme.textMuted }]}>{acc.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}

            {/* Payment Mode (UPI, Card, NetBanking, Wallet) */}
            <View style={styles.detailsRow}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Payment Mode</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {[
                  { id: 'UPI', label: '📱 UPI' },
                  { id: 'Card', label: '💳 Card' },
                  { id: 'NetBanking', label: '🏦 NetBanking' },
                  { id: 'Wallet', label: '👛 Wallet' },
                ].map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => {
                        setPaymentMethod(pm.id);
                        if (pm.id === 'UPI') setSelectedChip('GPay');
                        else if (pm.id === 'Card') setSelectedChip('HDFC Card');
                        else if (pm.id === 'NetBanking') setSelectedChip('HDFC Bank');
                        else setSelectedChip('Paytm Wallet');
                      }}
                      style={[
                        styles.accountChip,
                        {
                          backgroundColor: isSelected ? theme.primaryDim : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                          borderColor: isSelected ? theme.primary : isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    >
                      <Text style={[styles.accountChipText, { color: isSelected ? theme.primary : theme.textMuted }]}>
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Card / Bank Name Options (Dynamic per Payment Mode) */}
            {(paymentMethod === 'UPI' || paymentMethod === 'Card' || paymentMethod === 'NetBanking' || paymentMethod === 'Wallet') && (
              <View style={styles.noteContainer}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted, paddingHorizontal: 0, marginBottom: 4 }]}>
                  {paymentMethod === 'Card' ? 'Card Name / Bank' : paymentMethod === 'UPI' ? 'UPI App' : 'Bank / Provider'}
                </Text>

                {/* Option Chips (Defaults + User Custom Chips + Other) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                  {(() => {
                    const defaults =
                      paymentMethod === 'UPI'
                        ? ['GPay', 'PhonePe', 'Paytm']
                        : paymentMethod === 'Card'
                        ? ['HDFC Card', 'SBI Card', 'ICICI Card', 'Axis Card']
                        : paymentMethod === 'Wallet'
                        ? ['Paytm Wallet', 'Amazon Pay', 'PhonePe Wallet']
                        : ['HDFC Bank', 'SBI Bank', 'ICICI Bank', 'Axis Bank'];

                    const optionsList = [...defaults, ...customProviders, 'Other'];

                    return optionsList.map((provider) => {
                      const isSelected = selectedChip === provider;

                      return (
                        <TouchableOpacity
                          key={provider}
                          onPress={() => {
                            setSelectedChip(provider);
                            if (provider === 'Other') {
                              setBankOrCardName('');
                            } else {
                              setBankOrCardName(provider);
                            }
                          }}
                          style={[
                            styles.accountChip,
                            {
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: isSelected ? theme.primary : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FFFFFF' : theme.text }}>
                            {provider}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>

                {/* Manual Text Input Field with + Add Option Button (Only visible when "Other" is selected) */}
                {selectedChip === 'Other' && (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <TextInput
                      value={bankOrCardName}
                      onChangeText={setBankOrCardName}
                      placeholder={
                        paymentMethod === 'Card'
                          ? 'Type Card Name (e.g. HDFC Regalia, ICICI Amazon Pay)...'
                          : paymentMethod === 'UPI'
                          ? 'Type UPI App / VPA (e.g. BHIM, CRED, iMobile)...'
                          : 'Type Bank or Wallet Name...'
                      }
                      placeholderTextColor={theme.textDim}
                      style={[
                        styles.noteInput,
                        {
                          flex: 1,
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                          color: theme.text,
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        const trimmed = bankOrCardName.trim();
                        if (!trimmed) {
                          showGlassAlert('Enter Name', 'Please type a custom card or app name in the box first.', undefined, 'warning');
                          return;
                        }
                        if (!customProviders.includes(trimmed)) {
                          setCustomProviders((prev) => [...prev, trimmed]);
                          setSelectedChip(trimmed);
                          showGlassAlert('Option Added', `Added "${trimmed}" to your quick select chips!`, undefined, 'success');
                        } else {
                          setSelectedChip(trimmed);
                        }
                      }}
                      style={{
                        backgroundColor: theme.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.md,
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Note Input */}
            <View style={styles.noteContainer}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={type === 'income' ? 'Income note (e.g. Monthly Salary, Freelance project)...' : 'Add a note or description...'}
                placeholderTextColor={theme.textDim}
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    color: theme.text,
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
              />
            </View>

            {/* NumberPad */}
            <View style={styles.numberPadWrapper}>
              <NumberPad onPressDigit={handleDigitPress} onDelete={handleDeleteDigit} onClear={handleClear} />
            </View>

            {/* Save Button */}
            <View style={styles.actionButtonFooter}>
              <Button
                title={
                  initialTransaction
                    ? type === 'income' ? 'Update Income' : 'Update Expense'
                    : type === 'income' ? 'Record Income' : 'Record Expense'
                }
                onPress={handleSave}
                variant={type === 'income' ? 'primary' : 'danger'}
                style={{
                  backgroundColor: type === 'income' ? '#10B981' : '#EF4444',
                  shadowColor: type === 'income' ? '#10B981' : '#EF4444',
                }}
                size="lg"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CreateCategoryModal 
        visible={createCategoryVisible} 
        onClose={() => setCreateCategoryVisible(false)} 
        defaultType={type} 
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    height: '92%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    paddingTop: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 10,
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    pointerEvents: 'none',
  },
  ambientOrbBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    pointerEvents: 'none',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePillContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.round,
    padding: 3,
    borderWidth: 1,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '700',
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
    marginVertical: Spacing.xs,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 26,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 6,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
  groupsWrapper: {
    marginBottom: Spacing.md,
  },
  groupItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  splitWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  splitTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  splitTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  splitInputsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  detailsRow: {
    marginBottom: Spacing.sm,
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
  actionButtonFooter: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
});
