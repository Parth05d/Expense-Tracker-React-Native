import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated, TouchableWithoutFeedback } from 'react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, BorderRadius, Spacing, ShadowPresets } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glass' | 'highlight' | 'outlined';
  padding?: number;
  onPress?: () => void;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = Spacing.lg,
  onPress,
  interactive = false,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress && !interactive) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 25,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress && !interactive) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  let variantStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  };

  if (variant === 'glass') {
    variantStyle = {
      backgroundColor: theme.cardGlass,
      borderColor: theme.borderSubtle,
      borderTopColor: theme.glassHighlightTop,
      borderLeftColor: theme.glassHighlightLeft,
      borderWidth: 1,
      ...ShadowPresets.glass,
    };
  } else if (variant === 'highlight') {
    variantStyle = {
      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)',
      borderTopColor: 'rgba(52, 211, 153, 0.5)',
      borderWidth: 1,
      ...ShadowPresets.glowPrimary,
    };
  } else if (variant === 'outlined') {
    variantStyle = {
      backgroundColor: 'transparent',
      borderColor: theme.border,
      borderWidth: 1,
    };
  }

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        variantStyle,
        { padding, transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {/* Specular inner glass sheen line */}
      {variant === 'glass' && <View style={styles.glassSheenLine} />}
      {children}
    </Animated.View>
  );

  if (onPress || interactive) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {cardContent}
      </TouchableWithoutFeedback>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
