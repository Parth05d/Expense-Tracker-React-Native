import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, BorderRadius, Spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  let btnStyle: ViewStyle = {};
  let txtStyle: TextStyle = {};

  switch (variant) {
    case 'primary':
      btnStyle = {
        backgroundColor: theme.primary,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      };
      txtStyle = { color: '#FFFFFF', fontWeight: '700' };
      break;
    case 'secondary':
      btnStyle = { backgroundColor: theme.secondary, borderWidth: 1, borderColor: theme.border };
      txtStyle = { color: theme.text, fontWeight: '600' };
      break;
    case 'danger':
      btnStyle = { backgroundColor: theme.destructive };
      txtStyle = { color: '#FFFFFF', fontWeight: '700' };
      break;
    case 'ghost':
      btnStyle = { backgroundColor: 'transparent' };
      txtStyle = { color: theme.textMuted, fontWeight: '600' };
      break;
    case 'outline':
      btnStyle = { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary };
      txtStyle = { color: theme.primary, fontWeight: '600' };
      break;
  }

  let paddingVertical = Spacing.md;
  let paddingHorizontal = Spacing.lg;
  let fontSize = 16;

  if (size === 'sm') {
    paddingVertical = Spacing.sm;
    paddingHorizontal = Spacing.md;
    fontSize = 14;
  } else if (size === 'lg') {
    paddingVertical = Spacing.lg;
    paddingHorizontal = Spacing.xl;
    fontSize = 18;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        btnStyle,
        {
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtStyle.color as string} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              txtStyle,
              { fontSize },
              icon && iconPosition === 'left' ? { marginLeft: Spacing.sm } : undefined,
              icon && iconPosition === 'right' ? { marginRight: Spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  text: {
    textAlign: 'center',
  },
});
