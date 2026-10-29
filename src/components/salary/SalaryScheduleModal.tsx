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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { CustomSalaryEvent } from '../../types';
import { CURRENCY_CONFIGS, formatCurrency } from '../../utils/currency';
import { Button } from '../common/Button';
import { showGlassAlert } from '../common/GlassAlert';

interface SalaryScheduleModalProps {
  visible: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const SalaryScheduleModal: React.FC<SalaryScheduleModalProps> = ({ visible, onClose }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currencyCode = useExpenseStore((state) => state.settings.currency);
  const settings = useExpenseStore((state) => state.settings);
  const categories = useExpenseStore((state) => state.categories);
  const reminders = useExpenseStore((state) => state.reminders);
  const addReminder = useExpenseStore((state) => state.addReminder);
  const updateReminder = useExpenseStore((state) => state.updateReminder);

  const updateSettings = useExpenseStore((state) => state.updateSettings);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currencySymbol = CURRENCY_CONFIGS[currencyCode]?.symbol || '₹';

  // Form State
  const [payCycle, setPayCycle] = useState<'monthly' | 'biweekly' | 'weekly' | 'custom'>(
    settings.payCycle || settings.paycheckFrequency || 'monthly'
  );
  const [salaryAmount, setSalaryAmount] = useState<string>(
    String(settings.monthlyIncomeTarget || settings.monthlyIncome || 50000)
  );
  const [salaryDayOfMonth, setSalaryDayOfMonth] = useState<string>(
    String(settings.salaryDayOfMonth || 1)
  );
  const [salaryDayOfMonth2, setSalaryDayOfMonth2] = useState<string>(
    String(settings.salaryDayOfMonth2 || 15)
  );
  const [salaryDayOfWeek, setSalaryDayOfWeek] = useState<number>(
    settings.salaryDayOfWeek !== undefined ? settings.salaryDayOfWeek : 5
  );

  // Custom Events
  const [customEvents, setCustomEvents] = useState<CustomSalaryEvent[]>(
    settings.customSalaryEvents || []
  );

  // Calendar State
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());
  const [selectedDateIso, setSelectedDateIso] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Active Field selection for Bi-Weekly (day1 or day2)
  const [activeBiweeklyField, setActiveBiweeklyField] = useState<'day1' | 'day2'>('day1');

  // New Event Inputs
  const [newEvtAmount, setNewEvtAmount] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');

  useEffect(() => {
    if (visible) {
      setPayCycle(settings.payCycle || settings.paycheckFrequency || 'monthly');
      setSalaryAmount(String(settings.monthlyIncomeTarget || settings.monthlyIncome || 50000));
      setSalaryDayOfMonth(String(settings.salaryDayOfMonth || 1));
      setSalaryDayOfMonth2(String(settings.salaryDayOfMonth2 || 15));
      setSalaryDayOfWeek(settings.salaryDayOfWeek !== undefined ? settings.salaryDayOfWeek : 5);
      setCustomEvents(settings.customSalaryEvents || []);
      const todayIso = new Date().toISOString().split('T')[0];
      setSelectedDateIso(todayIso);
      setActiveBiweeklyField('day1');
    }
  }, [visible, settings]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (dayNum: number) => {
    const formattedMonth = String(calMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const iso = `${calYear}-${formattedMonth}-${formattedDay}`;

    setSelectedDateIso(iso);

    const clickedDate = new Date(calYear, calMonth, dayNum);
    const clickedDayOfWeek = clickedDate.getDay();

    if (payCycle === 'weekly') {
      setSalaryDayOfWeek(clickedDayOfWeek);
    } else if (payCycle === 'biweekly' && activeBiweeklyField === 'day2') {
      setSalaryDayOfMonth2(String(dayNum));
    } else {
      setSalaryDayOfMonth(String(dayNum));
    }
  };

  const handleAddCustomEvent = () => {
    if (!selectedDateIso || !newEvtAmount) {
      showGlassAlert('Missing Amount', 'Please enter expected salary amount for this date.', undefined, 'error');
      return;
    }

    const evt: CustomSalaryEvent = {
      id: `evt-${Date.now()}`,
      date: selectedDateIso,
      amount: parseFloat(newEvtAmount) || 0,
      description: newEvtDesc.trim() || 'Custom Salary',
    };

    setCustomEvents((prev) => [...prev, evt]);
    setNewEvtAmount('');
    setNewEvtDesc('');
  };

  const handleRemoveCustomEvent = (id: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    const numericIncome = parseFloat(salaryAmount) || 0;
    const numericDayNum = Math.min(31, Math.max(1, parseInt(salaryDayOfMonth, 10) || 1));
    const numericDayNum2 = Math.min(31, Math.max(1, parseInt(salaryDayOfMonth2, 10) || 15));

    await updateSettings({
      payCycle,
      paycheckFrequency: payCycle,
      monthlyIncomeTarget: numericIncome,
      monthlyIncome: numericIncome,
      salaryDayOfMonth: numericDayNum,
      salaryDayOfMonth2: numericDayNum2,
      salaryDayOfWeek,
      customSalaryEvents: customEvents,
    });

    // Automatically create/update Salary Credit Reminder for automated notification & income conversion
    if (numericIncome > 0) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      let nextPaydayIso = selectedDateIso;
      if (payCycle === 'monthly') {
        let paydayDate = new Date(currentYear, currentMonth, numericDayNum);
        if (paydayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          paydayDate = new Date(currentYear, currentMonth + 1, numericDayNum);
        }
        nextPaydayIso = paydayDate.toISOString().split('T')[0];
      } else if (payCycle === 'weekly') {
        let paydayDate = new Date();
        const currentDayOfWeek = paydayDate.getDay();
        let daysUntilPayday = (salaryDayOfWeek - currentDayOfWeek + 7) % 7;
        paydayDate.setDate(paydayDate.getDate() + daysUntilPayday);
        nextPaydayIso = paydayDate.toISOString().split('T')[0];
      }

      const salaryCat =
        categories.find((c) => c.type === 'income' && c.name.toLowerCase().includes('salary')) ||
        categories.find((c) => c.type === 'income');

      const existingSalaryReminder = reminders.find((r) => r.title.toLowerCase().includes('salary credit'));

      if (existingSalaryReminder) {
        await updateReminder(existingSalaryReminder.id, {
          amount: numericIncome,
          dueDate: nextPaydayIso,
          recurringPeriod: payCycle === 'monthly' ? 'monthly' : payCycle === 'weekly' ? 'weekly' : 'none',
          isCompleted: false,
        });
      } else {
        await addReminder({
          title: 'Salary Credit Payday',
          amount: numericIncome,
          type: 'money_receivable',
          dueDate: nextPaydayIso,
          categoryId: salaryCat?.id,
          note: 'Expected salary payout. Mark complete to convert to Income transaction.',
          recurringPeriod: payCycle === 'monthly' ? 'monthly' : payCycle === 'weekly' ? 'weekly' : 'none',
        });
      }

      showGlassAlert(
        'Salary Reminder Scheduled',
        `Payday reminder set for ${nextPaydayIso}. You will be notified to confirm when your salary is credited!`,
        undefined,
        'success'
      );
    }

    onClose();
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar Calculation
  const firstDayOfWeekIndex = new Date(calYear, calMonth, 1).getDay();
  const totalDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // Create grid cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeekIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    calendarCells.push(d);
  }

  // Scheduled date ISOs map
  const scheduledIsoMap = new Set(customEvents.map((e) => e.date));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        {/* Glassmorphic Sheet Container */}
        <View
          style={[
            styles.modalContainer,
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

          {/* Background Ambient Glow Orbs */}
          <View
            style={[
              styles.modalOrbTopRight,
              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' },
            ]}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryDim }]}>
                <CalendarIcon size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Salary & Payday Schedule</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Select dates from calendar to schedule income
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.secondary }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Pay Frequency Selector Card */}
            <View style={[styles.cardSection, { backgroundColor: theme.cardGlass, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PAYCHECK FREQUENCY</Text>
              <View style={styles.tabsRow}>
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'biweekly', label: 'Bi-Weekly' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'custom', label: 'Custom' },
                ].map((tab) => {
                  const isActive = payCycle === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      activeOpacity={0.7}
                      onPress={() => setPayCycle(tab.id as any)}
                      style={[
                        styles.tabChip,
                        {
                          backgroundColor: isActive ? theme.primaryDim : theme.secondary,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.tabText, { color: isActive ? theme.primary : theme.textMuted }]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Income Amount Card */}
            <View style={[styles.cardSection, { backgroundColor: theme.cardGlass, borderColor: theme.borderSubtle }]}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>BASE SALARY / INCOME AMOUNT</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                <Text style={[styles.currencyPrefix, { color: theme.primary }]}>{currencySymbol}</Text>
                <TextInput
                  value={salaryAmount}
                  onChangeText={setSalaryAmount}
                  keyboardType="numeric"
                  placeholder="50000"
                  placeholderTextColor={theme.textDim}
                  style={[styles.amountInput, { color: theme.text }]}
                />
              </View>
            </View>

            {/* Bi-Weekly Pay Days Card */}
            {payCycle === 'biweekly' && (
              <View style={[styles.cardSection, { backgroundColor: theme.cardGlass, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>BI-WEEKLY PAYDAYS (TWICE A MONTH)</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveBiweeklyField('day1')}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: activeBiweeklyField === 'day1' ? theme.primary : theme.textMuted, marginBottom: 4 }}>
                      1st Payday Date {activeBiweeklyField === 'day1' ? '(Active Selection)' : ''}
                    </Text>
                    <View style={[styles.inputRow, { backgroundColor: theme.secondary, borderColor: activeBiweeklyField === 'day1' ? theme.primary : theme.border }]}>
                      <Clock size={16} color={activeBiweeklyField === 'day1' ? theme.primary : theme.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={salaryDayOfMonth}
                        onFocus={() => setActiveBiweeklyField('day1')}
                        onChangeText={setSalaryDayOfMonth}
                        keyboardType="numeric"
                        placeholder="1"
                        placeholderTextColor={theme.textDim}
                        style={[styles.amountInput, { color: theme.text }]}
                      />
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>st/th</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveBiweeklyField('day2')}
                    style={{ flex: 1 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: activeBiweeklyField === 'day2' ? theme.primary : theme.textMuted, marginBottom: 4 }}>
                      2nd Payday Date {activeBiweeklyField === 'day2' ? '(Active Selection)' : ''}
                    </Text>
                    <View style={[styles.inputRow, { backgroundColor: theme.secondary, borderColor: activeBiweeklyField === 'day2' ? theme.primary : theme.border }]}>
                      <Clock size={16} color={activeBiweeklyField === 'day2' ? theme.primary : theme.textMuted} style={{ marginRight: 6 }} />
                      <TextInput
                        value={salaryDayOfMonth2}
                        onFocus={() => setActiveBiweeklyField('day2')}
                        onChangeText={setSalaryDayOfMonth2}
                        keyboardType="numeric"
                        placeholder="15"
                        placeholderTextColor={theme.textDim}
                        style={[styles.amountInput, { color: theme.text }]}
                      />
                      <Text style={{ fontSize: 11, color: theme.textMuted }}>st/th</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Interactive Visual Month Calendar Picker */}
            <View style={[styles.cardSection, { backgroundColor: theme.cardGlass, borderColor: theme.borderSubtle }]}>
              <View style={styles.calHeaderRow}>
                <Text style={[styles.calMonthTitle, { color: theme.text }]}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>

                <View style={styles.calNavBtns}>
                  <TouchableOpacity onPress={handlePrevMonth} style={[styles.calNavBtn, { backgroundColor: theme.secondary }]}>
                    <ChevronLeft size={16} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} style={[styles.calNavBtn, { backgroundColor: theme.secondary }]}>
                    <ChevronRight size={16} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weekday Header Labels */}
              <View style={styles.weekdayHeaderRow}>
                {WEEKDAY_NAMES.map((wd) => (
                  <Text key={wd} style={[styles.weekdayLabel, { color: theme.textMuted }]}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* 7-Column Calendar Days Grid */}
              <View style={styles.calGrid}>
                {calendarCells.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return <View key={`empty-${idx}`} style={styles.calCellEmpty} />;
                  }

                  const formattedMonth = String(calMonth + 1).padStart(2, '0');
                  const formattedDay = String(dayNum).padStart(2, '0');
                  const cellIso = `${calYear}-${formattedMonth}-${formattedDay}`;

                  const isSelected = selectedDateIso === cellIso;
                  const isScheduled = scheduledIsoMap.has(cellIso);
                  const cellDate = new Date(calYear, calMonth, dayNum);
                  const isWeeklyPayday = payCycle === 'weekly' && cellDate.getDay() === salaryDayOfWeek;
                  const isPaydayCell =
                    (payCycle === 'monthly' && parseInt(salaryDayOfMonth, 10) === dayNum) ||
                    (payCycle === 'biweekly' &&
                      (parseInt(salaryDayOfMonth, 10) === dayNum || parseInt(salaryDayOfMonth2, 10) === dayNum)) ||
                    isWeeklyPayday;

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      activeOpacity={0.7}
                      onPress={() => handleSelectCalendarDay(dayNum)}
                      style={[
                        styles.calCell,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : isPaydayCell
                            ? theme.primaryDim
                            : theme.secondary,
                          borderColor: isSelected
                            ? theme.primary
                            : isPaydayCell
                            ? theme.primary
                            : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calCellText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isPaydayCell
                              ? theme.primary
                              : theme.text,
                          },
                        ]}
                      >
                        {dayNum}
                      </Text>

                      {/* Dot Indicator for Scheduled Event */}
                      {isScheduled && !isSelected && <View style={[styles.dotIndicator, { backgroundColor: theme.primary }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.calFootnote, { color: theme.textMuted }]}>
                Selected Date: <Text style={{ color: theme.primary, fontWeight: '700' }}>{selectedDateIso}</Text>
              </Text>
            </View>

            {/* Custom Payday Event Entry Box for Selected Date */}
            {payCycle === 'custom' && (
              <View style={[styles.cardSection, { backgroundColor: theme.cardGlass, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
                  ADD SALARY ON {selectedDateIso}
                </Text>

                <View style={[styles.addEvtBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                  <TextInput
                    value={newEvtDesc}
                    onChangeText={setNewEvtDesc}
                    placeholder="Source (e.g. Freelance / Client)"
                    placeholderTextColor={theme.textDim}
                    style={[styles.smallInput, { color: theme.text, flex: 1 }]}
                  />
                  <TextInput
                    value={newEvtAmount}
                    onChangeText={setNewEvtAmount}
                    keyboardType="numeric"
                    placeholder={`Amount (${currencySymbol})`}
                    placeholderTextColor={theme.textDim}
                    style={[styles.smallInput, { color: theme.text, width: 110 }]}
                  />
                  <TouchableOpacity onPress={handleAddCustomEvent} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
                    <Plus size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {/* List of Custom Scheduled Events */}
                {customEvents.length > 0 && (
                  <View style={styles.evtListContainer}>
                    <Text style={[styles.subLabel, { color: theme.textMuted }]}>SCHEDULED DATES LIST ({customEvents.length})</Text>
                    {customEvents.map((evt) => (
                      <View key={evt.id} style={[styles.evtRow, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{evt.description}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11 }}>{evt.date}</Text>
                        </View>
                        <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '800', marginRight: 10 }}>
                          {currencySymbol}{evt.amount}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveCustomEvent(evt.id)}>
                          <Trash2 size={16} color={theme.destructive} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Save Button */}
            <View style={styles.footer}>
              <Button title="Save Salary Schedule" onPress={handleSave} variant="primary" size="lg" />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    maxHeight: '90%',
    padding: Spacing.xl,
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
  modalOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexGrow: 0,
    zIndex: 2,
  },
  scrollContent: {
    gap: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
  },
  cardSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  calHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  calMonthTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  calNavBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  calCellEmpty: {
    width: `${100 / 7}%`,
    height: 36,
  },
  calCell: {
    width: `${100 / 7}%`,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  calCellText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calFootnote: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  addEvtBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  smallInput: {
    height: 36,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evtListContainer: {
    marginTop: 6,
    gap: 4,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  evtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  footer: {
    marginTop: Spacing.xs,
  },
});
