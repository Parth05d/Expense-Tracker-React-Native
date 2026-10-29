import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  BellRing,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  CreditCard,
  Building2,
  TrendingUp,
  Repeat,
  Pin,
  HelpCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';
import { Card } from '../common/Card';
import { useExpenseStore } from '../../store/useExpenseStore';
import { Reminder, ReminderType } from '../../types';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { AddReminderModal } from './AddReminderModal';
import { showGlassAlert } from '../common/GlassAlert';

interface RemindersWidgetProps {
  limit?: number;
}

export const RemindersWidget: React.FC<RemindersWidgetProps> = ({ limit }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency || 'INR');
  const currencySymbol = useExpenseStore((state) => state.settings.currency === 'USD' ? '$' : '₹');
  const reminders = useExpenseStore((state) => state.reminders);
  const categories = useExpenseStore((state) => state.categories);
  const deleteReminder = useExpenseStore((state) => state.deleteReminder);
  const toggleReminderComplete = useExpenseStore((state) => state.toggleReminderComplete);

  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [activeFilter, setActiveFilter] = useState<'all' | ReminderType | 'upcoming' | 'completed'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  const currentYearMonth = todayStr.slice(0, 7);

  // Option A: Only sum active reminders due in current month (or overdue)
  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const currentMonthReminders = activeReminders.filter(
    (r) => r.dueDate <= todayStr || r.dueDate.startsWith(currentYearMonth)
  );

  const totalPayableDues = currentMonthReminders
    .filter((r) => r.type !== 'money_receivable')
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalReceivable = currentMonthReminders
    .filter((r) => r.type === 'money_receivable')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const filteredReminders = reminders.filter((r) => {
    if (r.isCompleted) {
      return activeFilter === 'completed';
    }

    if (activeFilter === 'completed') return false;

    const isCurrentMonthOrOverdue = r.dueDate <= todayStr || r.dueDate.startsWith(currentYearMonth);

    if (activeFilter === 'upcoming') {
      return !isCurrentMonthOrOverdue;
    }

    if (activeFilter === 'all') {
      return isCurrentMonthOrOverdue;
    }

    return r.type === activeFilter && isCurrentMonthOrOverdue;
  });

  const sortedReminders = [...filteredReminders].sort((a, b) => {
    return a.dueDate.localeCompare(b.dueDate);
  });

  const displayedReminders = limit ? sortedReminders.slice(0, limit) : sortedReminders;

  // Urgent count (due in current month or overdue)
  const urgentCount = currentMonthReminders.length;

  const getDueDateStatus = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { label: 'Completed', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 };
    }

    if (dueDate < todayStr) {
      const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        label: `Overdue (${diffDays}d)`,
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        icon: AlertTriangle,
      };
    }

    if (dueDate === todayStr) {
      return { label: 'Due Today', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock };
    }

    const diffTime = Math.abs(new Date(dueDate).getTime() - new Date(todayStr).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return {
        label: `Due in ${diffDays}d (Soon)`,
        color: '#6366F1',
        bg: 'rgba(99, 102, 241, 0.18)',
        icon: Clock,
      };
    }

    return {
      label: `Scheduled (${diffDays}d)`,
      color: theme.textMuted,
      bg: 'rgba(255, 255, 255, 0.05)',
      icon: Clock,
    };
  };

  const getTypeIcon = (type: ReminderType) => {
    switch (type) {
      case 'emi':
        return { icon: Building2, color: '#6366F1' };
      case 'sip':
        return { icon: TrendingUp, color: '#10B981' };
      case 'bill_payment':
        return { icon: CreditCard, color: '#EF4444' };
      case 'money_receivable':
        return { icon: TrendingUp, color: '#34D399' };
      case 'subscription':
        return { icon: Repeat, color: '#8B5CF6' };
      case 'personal':
        return { icon: Pin, color: '#3B82F6' };
      default:
        return { icon: HelpCircle, color: theme.textMuted };
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    if (!reminder.isCompleted) {
      await toggleReminderComplete(reminder.id, true);
      showGlassAlert(
        'Completed',
        `"${reminder.title}" marked as completed${reminder.amount > 0 ? ' and recorded in your budget!' : '.'}`,
        undefined,
        'success'
      );
    } else {
      await toggleReminderComplete(reminder.id, false);
    }
  };

  const handleDelete = (reminder: Reminder) => {
    showGlassAlert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReminder(reminder.id),
        },
      ],
      'warning'
    );
  };

  return (
    <Card variant="glass" style={styles.card}>
      {/* Card Header matching SharedOwedSummaryCard */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <BellRing size={16} color="#F59E0B" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Reminders & Dues</Text>
          {urgentCount > 0 && (
            <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }]}>
              <Text style={[styles.badgeText, { color: '#F59E0B' }]}>{urgentCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            setSelectedReminder(null);
            setModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Badges */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiBox, { backgroundColor: theme.secondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.kpiLabelRow}>
            <ArrowUpRight size={13} color={theme.destructive} />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>Upcoming Dues</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.destructive }]}>
            {formatCurrency(totalPayableDues, currency)}
          </Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: theme.secondary, borderColor: theme.borderSubtle }]}>
          <View style={styles.kpiLabelRow}>
            <ArrowDownLeft size={13} color={theme.primary} />
            <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>To Collect</Text>
          </View>
          <Text style={[styles.kpiValue, { color: theme.primary }]}>
            {formatCurrency(totalReceivable, currency)}
          </Text>
        </View>
      </View>

      {/* Category Filter ScrollView */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        {(
          [
            { id: 'all', label: 'Due Soon' },
            { id: 'upcoming', label: 'Scheduled (>7d)' },
            { id: 'sip', label: 'SIPs' },
            { id: 'emi', label: 'EMIs' },
            { id: 'bill_payment', label: 'Bills' },
            { id: 'money_receivable', label: 'To Collect' },
            { id: 'personal', label: 'Personal' },
            { id: 'completed', label: 'Completed' },
          ] as const
        ).map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id as any)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? theme.primary : theme.secondary,
                  borderColor: isSelected ? theme.primary : theme.borderSubtle,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : theme.textMuted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Reminders List */}
      {displayedReminders.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {activeFilter === 'completed'
              ? 'No completed reminders yet.'
              : activeFilter === 'upcoming'
              ? 'No future scheduled reminders (>7d).'
              : 'No dues or payments due in the next 7 days! ✨'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayedReminders.map((item) => {
            const status = getDueDateStatus(item.dueDate, item.isCompleted);
            const StatusIcon = status.icon;
            const typeInfo = getTypeIcon(item.type);
            const TypeIcon = typeInfo.icon;
            const cat = categories.find((c) => c.id === item.categoryId);

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  { backgroundColor: theme.secondary, borderColor: theme.borderSubtle },
                ]}
              >
                <View style={styles.itemMain}>
                  {/* Icon Avatar */}
                  <View style={[styles.iconAvatar, { backgroundColor: `${typeInfo.color}20` }]}>
                    <TypeIcon size={16} color={typeInfo.color} />
                  </View>

                  {/* Title & Category/Note */}
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemTitle, { color: theme.text }, item.isCompleted && styles.completedText]}>
                      {item.title}
                    </Text>

                    <View style={styles.metaRow}>
                      {!!cat && <Text style={[styles.metaText, { color: theme.textMuted }]}>{cat.name}</Text>}
                      {!!cat && !!item.note && <Text style={[styles.metaText, { color: theme.textMuted }]}> • </Text>}
                      {!!item.note && (
                        <Text numberOfLines={1} style={[styles.metaText, { color: theme.textMuted, flex: 1 }]}>
                          {item.note}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Amount */}
                  {item.amount > 0 && (
                    <Text
                      style={[
                        styles.amountText,
                        { color: item.type === 'money_receivable' ? theme.primary : theme.text },
                      ]}
                    >
                      {item.type === 'money_receivable' ? '+' : ''}
                      {formatCurrency(item.amount, currency)}
                    </Text>
                  )}
                </View>

                {/* Footer Status Badge & Action Buttons */}
                <View style={styles.itemFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <StatusIcon size={11} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>

                  <View style={styles.actionsGroup}>
                    <TouchableOpacity
                      onPress={() => handleToggleComplete(item)}
                      style={[
                        styles.actionBtn,
                        { backgroundColor: item.isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <CheckCircle2 size={14} color={item.isCompleted ? '#10B981' : theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedReminder(item);
                        setModalVisible(true);
                      }}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color={theme.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add / Edit Modal */}
      <AddReminderModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedReminder(null);
        }}
        initialReminder={selectedReminder}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterScrollView: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    gap: Spacing.xs,
  },
  itemRow: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 6,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
