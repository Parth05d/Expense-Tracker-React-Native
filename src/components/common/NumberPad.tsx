import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete } from 'lucide-react-native';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { useExpenseStore } from '../../store/useExpenseStore';

interface NumberPadProps {
  onPressDigit: (digit: string) => void;
  onDelete: () => void;
  onClear?: () => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  onPressDigit,
  onDelete,
  onClear,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((item) => {
            if (item === 'delete') {
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.7}
                  onPress={onDelete}
                  onLongPress={onClear}
                  style={[styles.key, { backgroundColor: theme.secondary }]}
                >
                  <Delete size={22} color={theme.text} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.7}
                onPress={() => onPressDigit(item)}
                style={[styles.key, { backgroundColor: theme.secondary }]}
              >
                <Text style={[styles.keyText, { color: theme.text }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  key: {
    flex: 1,
    height: 54,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
});
