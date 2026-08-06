import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import {
  User,
  Moon,
  Sun,
  Globe,
  Shield,
  RotateCcw,
  Plus,
  Trash2,
  DollarSign,
  PieChart,
} from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../constants/theme';
import { CURRENCY_CONFIGS, formatCurrency } from '../utils/currency';
import { CurrencyCode } from '../types';

interface ProfileScreenProps {
  onPressAnalytics: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onPressAnalytics }) => {
  const settings = useExpenseStore((state) => state.settings);
  const categories = useExpenseStore((state) => state.categories);
  const accounts = useExpenseStore((state) => state.accounts);
  const updateSettings = useExpenseStore((state) => state.updateSettings);
  const resetToDefaults = useExpenseStore((state) => state.resetToDefaults);

  const isDarkMode = settings.isDarkMode;
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Edit User details state
  const [userName, setUserName] = useState(settings.userName);
  const [monthlyIncome, setMonthlyIncome] = useState(
    String(settings.monthlyIncomeTarget || settings.monthlyIncome || 50000)
  );

  const handleSaveUserDetails = () => {
    const incomeNum = parseFloat(monthlyIncome) || 0;
    updateSettings({
      userName: userName.trim() || 'Alex',
      monthlyIncomeTarget: incomeNum,
      monthlyIncome: incomeNum,
    });
    Alert.alert('Settings Saved', 'Profile settings have been updated.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will restore all sample categories, accounts, and demo transactions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            Alert.alert('Success', 'Data has been reset to defaults.');
          },
        },
      ]
    );
  };

  const currencies = Object.values(CURRENCY_CONFIGS);
  const currentBuffer = settings.safetyBufferPercentage || settings.safetyBufferPercent || 10;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Header title="Preferences" subtitle="Settings & Configuration" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTitleRow}>
              <User size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Profile & Income</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Name</Text>
            <TextInput
              value={userName}
              onChangeText={setUserName}
              style={[
                styles.textInput,
                { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Monthly Income</Text>
            <TextInput
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
              style={[
                styles.textInput,
                { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>

          <Button
            title="Save Profile"
            onPress={handleSaveUserDetails}
            variant="secondary"
            size="sm"
          />
        </Card>

        {/* Currency Switcher */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTitleRow}>
              <Globe size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Currency</Text>
            </View>
            <Text style={[styles.currentCurrencyBadge, { color: theme.primary }]}>
              {CURRENCY_CONFIGS[settings.currency]?.symbol} {settings.currency}
            </Text>
          </View>

          <View style={styles.currencyGrid}>
            {currencies.map((curr) => {
              const isSelected = settings.currency === curr.code;
              return (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => updateSettings({ currency: curr.code as CurrencyCode })}
                  style={[
                    styles.currencyChip,
                    {
                      backgroundColor: isSelected ? theme.primaryDim : theme.secondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencySymbol,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.currencyCode,
                      { color: isSelected ? theme.primary : theme.textMuted },
                    ]}
                  >
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Guilt-Free Safety Buffer */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTitleRow}>
              <Shield size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Guilt-Free Safety Buffer
              </Text>
            </View>
            <Text style={[styles.bufferBadge, { color: theme.primary }]}>
              {currentBuffer}%
            </Text>
          </View>
          <Text style={[styles.cardDescription, { color: theme.textMuted }]}>
            Portion of monthly income automatically reserved for unforeseen expenses before calculating your daily guilt-free allowance.
          </Text>

          <View style={styles.bufferChips}>
            {[5, 10, 15, 20, 25].map((pct) => {
              const isSelected = currentBuffer === pct;
              return (
                <TouchableOpacity
                  key={pct}
                  onPress={() => updateSettings({ safetyBufferPercentage: pct, safetyBufferPercent: pct })}
                  style={[
                    styles.bufferChip,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.secondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bufferChipText,
                      { color: isSelected ? '#FFFFFF' : theme.textMuted },
                    ]}
                  >
                    {pct}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Appearance & Dark Mode Toggle */}
        <Card variant="glass" style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={styles.headerTitleRow}>
              {isDarkMode ? <Moon size={18} color={theme.primary} /> : <Sun size={18} color={theme.primary} />}
              <Text style={[styles.cardTitle, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => updateSettings({ isDarkMode: val })}
              trackColor={{ false: '#94A3B8', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* View Advanced Analytics Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressAnalytics}
          style={[styles.analyticsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <PieChart size={20} color={theme.primary} />
          <Text style={[styles.analyticsButtonText, { color: theme.text }]}>
            View Detailed Spending Analytics
          </Text>
        </TouchableOpacity>

        {/* Reset Demo Data */}
        <Card variant="outlined" style={styles.resetCard}>
          <View style={styles.resetRow}>
            <View style={styles.resetLeft}>
              <Text style={[styles.resetTitle, { color: theme.destructive }]}>
                Demo Data & Reset
              </Text>
              <Text style={[styles.resetSub, { color: theme.textMuted }]}>
                Restore sample transactions & categories
              </Text>
            </View>
            <TouchableOpacity onPress={handleResetData} style={[styles.resetBtn, { backgroundColor: theme.destructiveDim }]}>
              <RotateCcw size={16} color={theme.destructive} />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  sectionCard: {
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  currentCurrencyBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  bufferBadge: {
    fontSize: 14,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  bufferChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  bufferChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  analyticsButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetCard: {
    padding: Spacing.md,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetLeft: {
    flex: 1,
  },
  resetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
