import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Modal,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from './src/store/useExpenseStore';
import { DarkTheme, LightTheme } from './src/constants/theme';
import { BottomNav, TabScreen } from './src/components/common/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GroupsScreen } from './src/screens/GroupsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AddTransactionModal } from './src/components/transactions/AddTransactionModal';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { Transaction } from './src/types';
import { supabase } from './src/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { GoogleSignin } from './src/lib/googleAuth';
import { subscribeToNetworkStatus, checkIsOnline } from './src/utils/network';
import { GlassAlertModal, showGlassAlert } from './src/components/common/GlassAlert';
import { requestNotificationPermissions } from './src/services/notificationService';

export default function App() {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabScreen>('home');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  // Transaction Modal State
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Hardware Back Button Handler (Android)
  useEffect(() => {
    const onBackPress = () => {
      // If a modal is open, close modal first
      if (addModalVisible) {
        setAddModalVisible(false);
        setEditingTransaction(null);
        return true;
      }
      if (showAnalyticsModal) {
        setShowAnalyticsModal(false);
        return true;
      }

      // If user is on any screen other than Home, navigate to Home
      if (currentTab !== 'home') {
        setCurrentTab('home');
        return true;
      }

      // If user is on Home screen, prompt exit confirmation alert
      showGlassAlert(
        'Exit App',
        'Are you sure you want to exit Expense Tracker?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => BackHandler.exitApp(),
          },
        ],
        'confirm'
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentTab, addModalVisible, showAnalyticsModal]);

  useEffect(() => {
    // Request push notification permissions on app startup
    requestNotificationPermissions();

    const handleSession = async (session: Session | null) => {
      if (session) {
        await useExpenseStore.getState().fetchInitialData(session.user.id);
      }
      setSession(session);
      setLoadingAuth(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Subscribe to network status changes to process sync queue when back online
    const unsubscribeNetwork = subscribeToNetworkStatus((isOnline) => {
      useExpenseStore.getState().setOfflineStatus(!isOnline);
      if (isOnline) {
        useExpenseStore.getState().processSyncQueue();
      }
    });

    // Periodic network check every 15 seconds
    const interval = setInterval(() => {
      checkIsOnline();
    }, 15000);

    return () => {
      subscription.unsubscribe();
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, []);

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

  if (loadingAuth) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Show Authentication Screens if not logged in
  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />
        {authView === 'login' ? (
          <LoginScreen
            onLoginSuccess={() => {}}
            onNavigateToSignup={() => setAuthView('signup')}
          />
        ) : (
          <SignupScreen
            onSignupSuccess={() => {}}
            onNavigateToLogin={() => setAuthView('login')}
          />
        )}
        <GlassAlertModal />
      </SafeAreaProvider>
    );
  }

  // Main App
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.background}
        />

        {/* Top Offline Banner */}
        <OfflineBanner />

        {/* Screen Router */}
        <View style={styles.screenContainer}>
          {currentTab === 'home' && (
            <HomeScreen
              onPressProfile={() => setCurrentTab('profile')}
              onPressSeeAllTransactions={() => setCurrentTab('transactions')}
              onPressSeeAllBudgets={() => setCurrentTab('budget')}
              onPressSeeAllGroups={() => setCurrentTab('groups')}
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

          {currentTab === 'analytics' && (
            <AnalyticsScreen onPressProfile={() => setCurrentTab('profile')} />
          )}

          {currentTab === 'groups' && (
            <GroupsScreen onPressProfile={() => setCurrentTab('profile')} />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen onPressAnalytics={() => setCurrentTab('analytics')} />
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

          {/* Central High-Fidelity Glassmorphic Alert System */}
          <GlassAlertModal />
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
    paddingBottom: Platform.OS === 'ios' ? 70 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
