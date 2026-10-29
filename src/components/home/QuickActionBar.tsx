import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, PieChart, Sparkles } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';

interface QuickActionBarProps {
  onPressSalarySchedule: () => void;
  onPressAllocation: () => void;
  onPressAIInsights: () => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onPressSalarySchedule,
  onPressAllocation,
  onPressAIInsights,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressSalarySchedule}
          style={[
            styles.chip,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.borderSubtle,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <View style={[styles.iconDot, { backgroundColor: theme.primaryDim }]}>
            <Calendar size={13} color={theme.primary} />
          </View>
          <Text style={[styles.chipText, { color: theme.text }]}>Salary Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressAllocation}
          style={[
            styles.chip,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.borderSubtle,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <View style={[styles.iconDot, { backgroundColor: theme.primaryDim }]}>
            <PieChart size={13} color={theme.primary} />
          </View>
          <Text style={[styles.chipText, { color: theme.text }]}>Allocation Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressAIInsights}
          style={[
            styles.chip,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.borderSubtle,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <View style={[styles.iconDot, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Sparkles size={13} color="#8B5CF6" />
          </View>
          <Text style={[styles.chipText, { color: theme.text }]}>AI Financial Intelligence</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  iconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
