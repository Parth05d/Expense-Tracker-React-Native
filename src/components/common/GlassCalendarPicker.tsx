import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { Button } from './Button';

interface GlassCalendarPickerProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const GlassCalendarPicker: React.FC<GlassCalendarPickerProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Initial date parsing
  const initialDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const validInitialDate = isNaN(initialDateObj.getTime()) ? new Date() : initialDateObj;

  const [currentYear, setCurrentYear] = useState(validInitialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(validInitialDate.getMonth());
  const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handleDaySelect = (dayNum: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setTempSelectedDate(dateStr);
  };

  const handleConfirm = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  const setPresetDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const dateStr = d.toISOString().split('T')[0];
    setTempSelectedDate(dateStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.calendarCard,
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
            <View style={styles.titleRow}>
              <CalendarIcon size={18} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Select Due Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={[styles.navBtn, { backgroundColor: theme.secondary }]}>
              <ChevronLeft size={20} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.monthText, { color: theme.text }]}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={[styles.navBtn, { backgroundColor: theme.secondary }]}>
              <ChevronRight size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysHeaderRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[styles.dayHeaderCell, { color: theme.textMuted }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isSelected = tempSelectedDate === dateStr;
              const isToday = todayStr === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  onPress={() => handleDaySelect(dayNum)}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.primary, borderRadius: BorderRadius.round },
                    !isSelected && isToday && { borderWidth: 1, borderColor: theme.primary, borderRadius: BorderRadius.round },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: isSelected ? '#FFFFFF' : isToday ? theme.primary : theme.text },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Presets */}
          <View style={styles.presetsRow}>
            <TouchableOpacity onPress={() => setPresetDate(0)} style={[styles.presetPill, { borderColor: theme.borderSubtle }]}>
              <Text style={[styles.presetText, { color: theme.text }]}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPresetDate(1)} style={[styles.presetPill, { borderColor: theme.borderSubtle }]}>
              <Text style={[styles.presetText, { color: theme.text }]}>Tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPresetDate(7)} style={[styles.presetPill, { borderColor: theme.borderSubtle }]}>
              <Text style={[styles.presetText, { color: theme.text }]}>In 7 Days</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Action Button */}
          <View style={styles.actionRow}>
            <Button
              title={`Confirm (${tempSelectedDate || selectedDate})`}
              onPress={handleConfirm}
              variant="primary"
              size="md"
              isDarkMode={isDarkMode}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.xxl,
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
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: BorderRadius.round,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  presetPill: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: Spacing.xs,
  },
});
