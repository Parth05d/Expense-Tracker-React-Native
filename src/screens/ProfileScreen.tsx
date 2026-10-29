import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
} from 'react-native';
import {
  User,
  Moon,
  Sun,
  Globe,
  Shield,
  RotateCcw,
  PieChart,
  LogOut,
  Download,
  Calendar,
  Camera,
} from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ExportReportModal } from '../components/analytics/ExportReportModal';
import { SalaryScheduleModal } from '../components/salary/SalaryScheduleModal';
import { AvatarPickerModal } from '../components/profile/AvatarPickerModal';
import { AvatarImage } from '../components/common/AvatarImage';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';
import { useExpenseStore } from '../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../constants/theme';
import { CURRENCY_CONFIGS } from '../utils/currency';
import { CurrencyCode } from '../types';
import { supabase } from '../lib/supabase';
import { showGlassAlert } from '../components/common/GlassAlert';

interface ProfileScreenProps {
  onPressAnalytics: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onPressAnalytics }) => {
  const settings = useExpenseStore((state) => state.settings);
  const updateSettings = useExpenseStore((state) => state.updateSettings);
  const resetToDefaults = useExpenseStore((state) => state.resetToDefaults);

  const isDarkMode = settings.isDarkMode;
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const [refreshing, setRefreshing] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storeUserId = useExpenseStore.getState().userId;
    if (storeUserId) {
      await useExpenseStore.getState().fetchInitialData(storeUserId);
    }
    await useExpenseStore.getState().processSyncQueue();
    setRefreshing(false);
  }, []);

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
    showGlassAlert('Settings Saved', 'Profile settings have been updated.', undefined, 'success');
  };

  const handleResetData = () => {
    showGlassAlert(
      'Reset All Data',
      'This will restore all sample categories, accounts, and demo transactions. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            showGlassAlert('Success', 'Data has been reset to defaults.', undefined, 'success');
          },
        },
      ],
      'warning'
    );
  };

  const handleSignOut = async () => {
    showGlassAlert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ],
      'confirm'
    );
  };

  const currencies = Object.values(CURRENCY_CONFIGS);
  const currentBuffer = settings.safetyBufferPercentage || settings.safetyBufferPercent || 10;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Ambient Depth Orbs */}
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbLeftCenter,
          {
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.14)' : 'rgba(37, 99, 235, 0.08)',
          },
        ]}
      />

      <Header title="Preferences" subtitle="Settings & Configuration" />

      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
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

          {/* Interactive Profile Photo Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              style={[styles.avatarTouch, { borderColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <AvatarImage url={settings.avatarUrl} size={70} fallbackColor={theme.primaryDim} iconColor={theme.primary} />
              <View style={[styles.editCameraBadge, { backgroundColor: theme.primary }]}>
                <Camera size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAvatarModalVisible(true)} activeOpacity={0.7}>
              <Text style={[styles.changeAvatarText, { color: theme.primary }]}>
                {settings.avatarUrl ? 'Change Profile Photo' : 'Add Profile Photo'}
              </Text>
            </TouchableOpacity>
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

        {/* Salary & Payday Schedule Settings Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSalaryModalVisible(true)}
          style={[
            styles.analyticsButton,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.glassHighlightTop,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <Calendar size={20} color={theme.primary} />
          <Text style={[styles.analyticsButtonText, { color: theme.text }]}>
            Salary & Payday Schedule Settings
          </Text>
        </TouchableOpacity>

        {/* View Advanced Analytics Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPressAnalytics}
          style={[
            styles.analyticsButton,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.glassHighlightTop,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <PieChart size={20} color={theme.primary} />
          <Text style={[styles.analyticsButtonText, { color: theme.text }]}>
            View Detailed Spending Analytics
          </Text>
        </TouchableOpacity>

        {/* Export Financial Statement Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExportModalVisible(true)}
          style={[
            styles.analyticsButton,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.glassHighlightTop,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <Download size={20} color={theme.primary} />
          <Text style={[styles.analyticsButtonText, { color: theme.text }]}>
            Export Financial Statements & CSV Data
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

        {/* Sign Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignOut}
          style={[
            styles.signOutButton,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.glassHighlightTop,
            },
          ]}
        >
          <LogOut size={20} color={theme.destructive} />
          <Text style={[styles.signOutButtonText, { color: theme.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </CustomRefreshControl>

      {/* Export Report Sheet Modal */}
      <ExportReportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />

      {/* Salary & Payday Schedule Modal */}
      <SalaryScheduleModal
        visible={salaryModalVisible}
        onClose={() => setSalaryModalVisible(false)}
      />

      {/* Profile Photo Avatar Picker Modal */}
      <AvatarPickerModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    pointerEvents: 'none',
  },
  ambientOrbLeftCenter: {
    position: 'absolute',
    top: 290,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    pointerEvents: 'none',
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
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
    gap: 6,
  },
  avatarTouch: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileAvatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changeAvatarText: {
    fontSize: 12,
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
