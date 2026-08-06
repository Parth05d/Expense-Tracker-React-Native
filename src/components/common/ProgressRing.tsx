import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { DarkTheme, LightTheme } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  heroValue: string;
  subLabel: string;
  status?: 'safe' | 'caution' | 'exhausted';
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 210,
  strokeWidth = 14,
  progress, // percentage remaining or spent
  heroValue,
  subLabel,
  status = 'safe',
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (circumference * clampedProgress) / 100;

  // Determine stroke color
  let primaryStroke = theme.primary;
  let gradientEnd = theme.primaryLight;

  if (status === 'caution') {
    primaryStroke = theme.accentAmber;
    gradientEnd = '#FBBF24';
  } else if (status === 'exhausted') {
    primaryStroke = theme.destructive;
    gradientEnd = '#F43F5E';
  }

  const trackStroke = isDarkMode ? '#272A35' : '#E2E8F0';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={primaryStroke} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>

        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackStroke}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Active Progress Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Hero Content Centered in the Ring */}
      <View style={styles.content}>
        <Text style={[styles.heroText, { color: theme.text }]}>
          {heroValue}
        </Text>
        <Text style={[styles.subLabel, { color: theme.textMuted }]}>
          {subLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  heroText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});
