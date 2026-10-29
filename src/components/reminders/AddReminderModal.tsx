import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {
  X,
  Calendar,
  DollarSign,
  CreditCard,
  Building2,
  TrendingUp,
  Repeat,
  Pin,
  Tag,
  FileText,
  Check,
} from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { ReminderType, Reminder } from '../../types';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { Button } from '../common/Button';
import { showGlassAlert } from '../common/GlassAlert';
import { GlassCalendarPicker } from '../common/GlassCalendarPicker';

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  initialReminder?: Reminder | null;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({
  visible,
  onClose,
  initialReminder,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currencySymbol = useExpenseStore((state) => state.settings.currency || '₹');
  const categories = useExpenseStore((state) => state.categories);
  const addReminder = useExpenseStore((state) => state.addReminder);
  const updateReminder = useExpenseStore((state) => state.updateReminder);

  const theme = isDarkMode ? DarkTheme : LightTheme;

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ReminderType>('bill_payment');
  const [dueDate, setDueDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(categories[0]?.id);
  const [note, setNote] = useState('');
  const [recurringPeriod, setRecurringPeriod] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none');

  useEffect(() => {
    if (visible) {
      if (initialReminder) {
        setTitle(initialReminder.title);
        setAmount(initialReminder.amount ? String(initialReminder.amount) : '');
        setType(initialReminder.type);
        setDueDate(initialReminder.dueDate || todayStr);
        setSelectedCategoryId(initialReminder.categoryId || categories[0]?.id);
        setNote(initialReminder.note || '');
        setRecurringPeriod(initialReminder.recurringPeriod || 'none');
      } else {
        setTitle('');
        setAmount('');
        setType('bill_payment');
        setDueDate(todayStr);
        setSelectedCategoryId(categories[0]?.id);
        setNote('');
        setRecurringPeriod('none');
      }
    }
  }, [visible, initialReminder]);

  const reminderTypes: { type: ReminderType; label: string; icon: any; color: string }[] = [
    { type: 'bill_payment', label: 'Bill Payment', icon: CreditCard, color: '#EF4444' },
    { type: 'emi', label: 'Loan / EMI', icon: Building2, color: '#6366F1' },
    { type: 'sip', label: 'SIP / Investment', icon: TrendingUp, color: '#10B981' },
    { type: 'money_receivable', label: 'To Collect', icon: TrendingUp, color: '#34D399' },
    { type: 'subscription', label: 'Subscription', icon: Repeat, color: '#8B5CF6' },
    { type: 'personal', label: 'Personal', icon: Pin, color: '#3B82F6' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      showGlassAlert('Missing Title', 'Please enter a title for the reminder.', undefined, 'warning');
      return;
    }

    const numAmount = parseFloat(amount) || 0;

    if (initialReminder) {
      await updateReminder(initialReminder.id, {
        title: title.trim(),
        amount: numAmount,
        type,
        dueDate,
        categoryId: selectedCategoryId,
        note: note.trim() || undefined,
        recurringPeriod,
      });
      showGlassAlert('Updated', 'Reminder updated successfully.', undefined, 'success');
    } else {
      await addReminder({
        title: title.trim(),
        amount: numAmount,
        type,
        dueDate,
        categoryId: selectedCategoryId,
        note: note.trim() || undefined,
        recurringPeriod,
      });
      showGlassAlert('Created', 'New reminder created successfully.', undefined, 'success');
    }

    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
              ...ShadowPresets.glass,
            },
          ]}
        >
          {/* Top Sheen */}
          <View style={styles.glassSheenLine} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {initialReminder ? 'Edit Reminder' : 'New Custom Reminder'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            >
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
            {/* Reminder Type Pills */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Reminder Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollView}>
              {reminderTypes.map((item) => {
                const IconComp = item.icon;
                const isSelected = type === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    onPress={() => setType(item.type)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: isSelected ? item.color : 'rgba(255, 255, 255, 0.05)',
                        borderColor: isSelected ? item.color : theme.borderSubtle,
                      },
                    ]}
                  >
                    <IconComp size={16} color={isSelected ? '#FFFFFF' : item.color} />
                    <Text
                      style={[
                        styles.typePillText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Title / Description</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: theme.borderSubtle },
              ]}
            >
              <FileText size={18} color={theme.textMuted} style={styles.inputIcon} />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Electricity Bill, Car EMI, John Payback"
                placeholderTextColor={theme.textMuted}
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>

            {/* Amount Input */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Amount ({currencySymbol})</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: theme.borderSubtle },
              ]}
            >
              <Text style={[styles.currencyPrefix, { color: theme.primary }]}>{currencySymbol}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00 (Optional)"
                placeholderTextColor={theme.textMuted}
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>

            {/* Due Date Input & Calendar Trigger */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Due Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              style={[
                styles.inputWrapper,
                { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: theme.borderSubtle },
              ]}
            >
              <Calendar size={18} color={theme.primary} style={styles.inputIcon} />
              <Text style={[styles.textInput, { color: theme.text, textAlignVertical: 'center' }]}>
                {dueDate || 'Select Due Date'}
              </Text>
            </TouchableOpacity>

            {/* Quick Due Date Presets */}
            <View style={styles.datePresetsRow}>
              <TouchableOpacity
                onPress={() => setDueDate(todayStr)}
                style={[styles.datePresetBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.datePresetText, { color: theme.text }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const tm = new Date();
                  tm.setDate(tm.getDate() + 1);
                  setDueDate(tm.toISOString().split('T')[0]);
                }}
                style={[styles.datePresetBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.datePresetText, { color: theme.text }]}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const in7 = new Date();
                  in7.setDate(in7.getDate() + 7);
                  setDueDate(in7.toISOString().split('T')[0]);
                }}
                style={[styles.datePresetBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.datePresetText, { color: theme.text }]}>In 7 Days</Text>
              </TouchableOpacity>
            </View>

            {/* Recurring Frequency */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Recurring Frequency</Text>
            <View style={styles.recurringRow}>
              {(['none', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setRecurringPeriod(period)}
                  style={[
                    styles.recurringBtn,
                    {
                      backgroundColor:
                        recurringPeriod === period ? theme.primary : 'rgba(255, 255, 255, 0.04)',
                      borderColor: recurringPeriod === period ? theme.primary : theme.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.recurringText,
                      { color: recurringPeriod === period ? '#FFFFFF' : theme.textMuted },
                    ]}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Dropdown/Selector */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Linked Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
              {categories
                .filter((cat) => cat.type === (type === 'money_receivable' ? 'income' : 'expense'))
                .map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategoryId(cat.id)}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isSelected ? cat.color : 'rgba(255, 255, 255, 0.04)',
                          borderColor: isSelected ? cat.color : theme.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.categoryPillText, { color: isSelected ? '#FFFFFF' : theme.text }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            {/* Note Input */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Notes / Reference</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: theme.borderSubtle },
              ]}
            >
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add additional details or account info..."
                placeholderTextColor={theme.textMuted}
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.submitRow}>
              <Button
                title={initialReminder ? 'Save Changes' : type === 'money_receivable' ? 'Record Income Reminder' : 'Create Expense Reminder'}
                onPress={handleSubmit}
                variant={type === 'money_receivable' ? 'primary' : 'danger'}
                size="lg"
                isDarkMode={isDarkMode}
                style={{
                  width: '100%',
                  backgroundColor: type === 'money_receivable' ? '#10B981' : '#EF4444',
                  shadowColor: type === 'money_receivable' ? '#10B981' : '#EF4444',
                }}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Interactive Glassmorphic Calendar Picker */}
      <GlassCalendarPicker
        visible={showDatePicker}
        selectedDate={dueDate}
        onSelectDate={setDueDate}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  formContainer: {
    paddingBottom: Spacing.xxl,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  typeScrollView: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.xs,
    gap: Spacing.xs,
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  datePresetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  datePresetBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  datePresetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  recurringBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScrollView: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitRow: {
    marginTop: Spacing.xl,
  },
});
