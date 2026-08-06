import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius } from '../../constants/theme';

interface CategoryBadgeProps {
  icon: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  icon,
  color = '#10B981',
  size = 'md',
  style,
}) => {
  let dimension = 44;
  let fontSize = 20;

  if (size === 'sm') {
    dimension = 32;
    fontSize = 14;
  } else if (size === 'lg') {
    dimension = 52;
    fontSize = 24;
  } else if (size === 'xl') {
    dimension = 64;
    fontSize = 32;
  }

  // Convert hex color to light tint for background
  const backgroundColor = `${color}20`; // 12% opacity hex tint

  return (
    <View
      style={[
        styles.badge,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={{ fontSize }}>{icon}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
