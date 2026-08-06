import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from './src/store/useExpenseStore';
import { DarkTheme, LightTheme } from './src/constants/theme';
import { BottomNav, TabScreen } from './src/components/common/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AddTransactionModal } from './src/components/transactions/AddTransactionModal';
import { Transaction } from './src/types';

export default function App() {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabScreen>('home');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  // Transaction Modal State
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setAddModalVisible(true);
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAddModalVisible(true);
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    setEditingTransaction(null);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />

        {/* Screen Router */}
        <View style={styles.screenContainer}>
          {currentTab === 'home' && (
            <HomeScreen
              onPressProfile={() => setCurrentTab('profile')}
              onPressSeeAllTransactions={() => setCurrentTab('transactions')}
              onPressSeeAllBudgets={() => setCurrentTab('budget')}
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsScreen
              onSelectTransaction={handleSelectTransaction}
              onPressProfile={() => setCurrentTab('profile')}
            />
          )}

          {currentTab === 'budget' && (
            <BudgetScreen onPressProfile={() => setCurrentTab('profile')} />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen onPressAnalytics={() => setShowAnalyticsModal(true)} />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onPressAdd={handleOpenAdd}
        />

        {/* Add / Edit Transaction Bottom Sheet Modal */}
        <AddTransactionModal
          visible={addModalVisible}
          onClose={handleCloseAddModal}
          initialTransaction={editingTransaction}
        />

        {/* Analytics Modal View */}
        <Modal
          visible={showAnalyticsModal}
          animationType="slide"
          onRequestClose={() => setShowAnalyticsModal(false)}
        >
          <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={theme.background}
            />
            <AnalyticsScreen onPressProfile={() => setShowAnalyticsModal(false)} />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
