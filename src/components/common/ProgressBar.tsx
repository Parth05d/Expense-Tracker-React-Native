import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DarkTheme, LightTheme, BorderRadius } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  isOverBudget?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  isOverBudget = false,
  style,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const clamped = Math.min(100, Math.max(0, progress));

  // Determine progress bar fill color
  let fillColor = theme.primary;
  if (isOverBudget || clamped >= 100) {
    fillColor = theme.destructive;
  } else if (clamped >= 80) {
    fillColor = theme.accentAmber;
  }

  const trackColor = isDarkMode ? '#272A35' : '#F1F5F9';

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
