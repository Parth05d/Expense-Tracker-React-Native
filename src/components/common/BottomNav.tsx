import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, ListOrdered, Plus, PieChart, User } from 'lucide-react-native';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

export type TabScreen = 'home' | 'transactions' | 'budget' | 'profile';

interface BottomNavProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
  onPressAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onPressAdd,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const tabs: { id: TabScreen; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Activity', icon: ListOrdered },
    { id: 'budget', label: 'Budgets', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <View style={styles.container}>
        {/* Left tabs: Home, Transactions */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('home')}
          style={styles.tabButton}
        >
          <Home
            size={22}
            color={currentTab === 'home' ? theme.primary : theme.textMuted}
            strokeWidth={currentTab === 'home' ? 2.5 : 2}
          />
          {currentTab === 'home' && (
            <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('transactions')}
          style={styles.tabButton}
        >
          <ListOrdered
            size={22}
            color={currentTab === 'transactions' ? theme.primary : theme.textMuted}
            strokeWidth={currentTab === 'transactions' ? 2.5 : 2}
          />
          {currentTab === 'transactions' && (
            <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>

        {/* Center Floating Action Button: Add Transaction */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPressAdd}
            style={[
              styles.fabButton,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Right tabs: Budget, Profile */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('budget')}
          style={styles.tabButton}
        >
          <PieChart
            size={22}
            color={currentTab === 'budget' ? theme.primary : theme.textMuted}
            strokeWidth={currentTab === 'budget' ? 2.5 : 2}
          />
          {currentTab === 'budget' && (
            <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onSelectTab('profile')}
          style={styles.tabButton}
        >
          <User
            size={22}
            color={currentTab === 'profile' ? theme.primary : theme.textMuted}
            strokeWidth={currentTab === 'profile' ? 2.5 : 2}
          />
          {currentTab === 'profile' && (
            <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  centerFabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
