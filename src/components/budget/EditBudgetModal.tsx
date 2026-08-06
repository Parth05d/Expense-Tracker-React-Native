import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Plus, Minus } from 'lucide-react-native';
import { Budget, Category } from '../../types';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { CURRENCY_CONFIGS, formatCurrency } from '../../utils/currency';
import { getCurrentYearMonth } from '../../utils/dateHelpers';
import { CategoryBadge } from '../common/CategoryBadge';
import { Button } from '../common/Button';

interface EditBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budget: Budget | null;
  category: Category | null;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  visible,
  onClose,
  budget,
  category,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currencyCode = useExpenseStore((state) => state.settings.currency);
  const setBudget = useExpenseStore((state) => state.setBudget);
  const updateBudget = useExpenseStore((state) => state.updateBudget);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currencySymbol = CURRENCY_CONFIGS[currencyCode]?.symbol || '₹';

  const [amountStr, setAmountStr] = useState<string>('0');

  useEffect(() => {
    if (visible && budget) {
      setAmountStr(String(budget.amount));
    } else if (visible && !budget) {
      setAmountStr('5000');
    }
  }, [visible, budget]);

  const handleAdjust = (delta: number) => {
    const current = parseFloat(amountStr) || 0;
    const next = Math.max(0, current + delta);
    setAmountStr(String(next));
  };

  const handleSave = () => {
    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount) || numericAmount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }

    if (category) {
      if (budget) {
        updateBudget(budget.id, numericAmount);
      } else {
        setBudget(category.id, numericAmount, getCurrentYearMonth());
      }
    }

    onClose();
  };

  if (!category) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CategoryBadge icon={category.icon} color={category.color} size="sm" />
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {category.name} Budget
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.secondary }]}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Monthly Spending Limit</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={[styles.currencyPrefix, { color: theme.primary }]}>{currencySymbol}</Text>
              <TextInput
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="numeric"
                style={[styles.amountInput, { color: theme.text }]}
              />
            </View>
          </View>

          {/* Quick Adjustment Chips */}
          <View style={styles.adjustChips}>
            <TouchableOpacity
              onPress={() => handleAdjust(-1000)}
              style={[styles.chip, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.chipText, { color: theme.textMuted }]}>-1,000</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAdjust(-500)}
              style={[styles.chip, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.chipText, { color: theme.textMuted }]}>-500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAdjust(500)}
              style={[styles.chip, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.chipText, { color: theme.primary }]}>+500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAdjust(1000)}
              style={[styles.chip, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.chipText, { color: theme.primary }]}>+1,000</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Save Limit"
              onPress={handleSave}
              size="md"
              style={{ width: '100%' }}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    height: '100%',
  },
  adjustChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    marginTop: Spacing.xs,
  },
});
