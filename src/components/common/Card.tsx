import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, BorderRadius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'highlight' | 'outlined';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = Spacing.lg,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  let variantStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  };

  if (variant === 'glass') {
    variantStyle = {
      backgroundColor: theme.cardGlass,
      borderColor: theme.borderSubtle,
      borderWidth: 1,
    };
  } else if (variant === 'highlight') {
    variantStyle = {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.3)',
      borderWidth: 1,
    };
  } else if (variant === 'outlined') {
    variantStyle = {
      backgroundColor: 'transparent',
      borderColor: theme.border,
      borderWidth: 1,
    };
  }

  return (
    <View style={[styles.card, variantStyle, { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
});
