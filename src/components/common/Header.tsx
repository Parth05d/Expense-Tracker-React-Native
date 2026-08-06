import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Bell } from 'lucide-react-native';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onPressProfile?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onPressProfile,
  rightAction,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const userName = useExpenseStore((state) => state.settings.userName);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const currentHour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    timeGreeting = 'Good evening';
  }

  const defaultSubtitle = `${timeGreeting}, ${userName}`;
  const defaultTitle = 'Your Dashboard';

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {subtitle || defaultSubtitle}
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {title || defaultTitle}
        </Text>
      </View>

      <View style={styles.right}>
        {rightAction ? (
          rightAction
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPressProfile}
            style={[styles.avatarButton, { backgroundColor: theme.secondary, borderColor: theme.border }]}
          >
            <User size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  left: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
