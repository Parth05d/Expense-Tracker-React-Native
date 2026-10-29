import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { DarkTheme, LightTheme, BorderRadius, Spacing, ShadowPresets } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  isDarkMode?: boolean;
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
  isDarkMode = true,
  style,
  textStyle,
}) => {
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  let btnStyle: ViewStyle = {};
  let txtStyle: TextStyle = {};

  switch (variant) {
    case 'primary':
      btnStyle = {
        backgroundColor: theme.primary,
        ...ShadowPresets.glowPrimary,
      };
      txtStyle = { color: '#FFFFFF', fontWeight: '700' };
      break;
    case 'secondary':
      btnStyle = {
        backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
        borderWidth: 1,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
      };
      txtStyle = { color: theme.text, fontWeight: '600' };
      break;
    case 'danger':
      btnStyle = {
        backgroundColor: theme.destructive,
        shadowColor: theme.destructive,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
      };
      txtStyle = { color: '#FFFFFF', fontWeight: '700' };
      break;
    case 'ghost':
      btnStyle = { backgroundColor: 'transparent' };
      txtStyle = { color: theme.textMuted, fontWeight: '600' };
      break;
    case 'outline':
      btnStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.primary,
      };
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
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          btnStyle,
          {
            paddingVertical,
            paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
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
      </Animated.View>
    </TouchableWithoutFeedback>
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
