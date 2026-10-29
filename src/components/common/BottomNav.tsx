import React, { useRef } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Platform, Text } from 'react-native';
import { Home, ListOrdered, Plus, BarChart2, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme, LightTheme, ShadowPresets } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

export type TabScreen = 'home' | 'transactions' | 'analytics' | 'groups' | 'budget' | 'profile';

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
  const fabScale = useRef(new Animated.Value(1)).current;

  const handleFabPressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const renderTabItem = (id: TabScreen, label: string, IconComponent: any) => {
    const isActive = currentTab === id;
    return (
      <TouchableWithoutFeedback key={id} onPress={() => onSelectTab(id)}>
        <View style={styles.tabButton}>
          <View
            style={[
              styles.iconWrapper,
              isActive && {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
                borderColor: theme.primary,
              },
            ]}
          >
            <IconComponent
              size={20}
              color={isActive ? theme.primary : theme.textMuted}
              strokeWidth={isActive ? 2.4 : 1.8}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              { color: isActive ? theme.primary : theme.textMuted, fontWeight: isActive ? '700' : '500' },
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.floatingGlassDock,
          {
            backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
      >
        {/* Top Sheen Reflection */}
        <View
          style={[
            styles.glassSheenLine,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.8)' },
          ]}
        />

        <View style={styles.dockContent}>
          {renderTabItem('home', 'Home', Home)}
          {renderTabItem('transactions', 'Bills', ListOrdered)}

          {/* Floating Center Action Button */}
          <View style={styles.centerFabContainer}>
            <TouchableWithoutFeedback
              onPressIn={handleFabPressIn}
              onPressOut={handleFabPressOut}
              onPress={onPressAdd}
            >
              <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5', '#4338CA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.fabButton, ShadowPresets.glowPrimary]}
                >
                  <Plus size={26} color="#FFFFFF" strokeWidth={3} />
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>

          {renderTabItem('analytics', 'Stats', BarChart2)}
          {renderTabItem('groups', 'Groups', Users)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    pointerEvents: 'box-none',
    zIndex: 999,
  },
  floatingGlassDock: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 1,
    zIndex: 2,
  },
  dockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  centerFabContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
