import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';

interface CategorySlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  slices: CategorySlice[];
  totalAmount: number;
  size?: number;
  strokeWidth?: number;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  slices,
  totalAmount,
  size = 200,
  strokeWidth = 22,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Filter non-zero slices
  const validSlices = slices.filter((s) => s.amount > 0);

  // Compute accumulated stroke offsets for each segment
  let accumulatedAngle = 0;

  return (
    <View style={styles.container}>
      <View style={[styles.chartWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Base track circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isDarkMode ? '#272A35' : '#E2E8F0'}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Slices */}
          {validSlices.map((slice) => {
            const slicePercent = totalAmount > 0 ? slice.amount / totalAmount : 0;
            const strokeDasharray = `${circumference * slicePercent} ${circumference * (1 - slicePercent)}`;
            const currentRotation = accumulatedAngle * 360 - 90;
            accumulatedAngle += slicePercent;

            return (
              <Circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={0}
                fill="none"
                transform={`rotate(${currentRotation} ${center} ${center})`}
              />
            );
          })}
        </Svg>

        {/* Center Total Display */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.centerSub, { color: theme.textMuted }]}>
            Total Spent
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.centerAmount, { color: theme.text }]}
          >
            {formatCurrency(totalAmount, currency, { hideDecimals: true })}
          </Text>
        </View>
      </View>

      {/* Slices Legend */}
      <View style={styles.legendContainer}>
        {validSlices.map((slice) => (
          <View key={slice.id} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.colorDot, { backgroundColor: slice.color }]} />
              <Text style={styles.legendEmoji}>{slice.icon}</Text>
              <Text numberOfLines={1} style={[styles.legendName, { color: theme.text }]}>
                {slice.name}
              </Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={[styles.legendAmount, { color: theme.text }]}>
                {formatCurrency(slice.amount, currency, { hideDecimals: true })}
              </Text>
              <Text style={[styles.legendPct, { color: theme.textMuted }]}>
                ({Math.round(slice.percentage)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  centerSub: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  centerAmount: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  legendContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendEmoji: {
    fontSize: 14,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendPct: {
    fontSize: 11,
    fontWeight: '500',
  },
});
