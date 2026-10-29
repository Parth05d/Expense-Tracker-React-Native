import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  StyleProp,
  ViewStyle,
  Easing,
} from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, BorderRadius, ShadowPresets } from '../../constants/theme';

interface CustomRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  onRefresh,
  children,
  contentContainerStyle,
  style,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const pullAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      Animated.spring(pullAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();

      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.spring(pullAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
      spinAnim.setValue(0);
    }
  }, [refreshing]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const capsuleScale = pullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const capsuleOpacity = pullAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Custom Glass Floating Capsule Banner */}
      {refreshing && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glassCapsule,
            {
              backgroundColor: theme.cardGlass,
              borderColor: theme.borderSubtle,
              borderTopColor: theme.glassHighlightTop,
              transform: [{ scale: capsuleScale }],
              opacity: capsuleOpacity,
              ...ShadowPresets.glass,
            },
          ]}
        >
          <View style={styles.capsuleContent}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={16} color={theme.primary} strokeWidth={2.5} />
            </Animated.View>
            <Text style={[styles.capsuleText, { color: theme.text }]}>
              Syncing latest data...
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
            progressViewOffset={-500}
          />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  glassCapsule: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    zIndex: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    elevation: 10,
  },
  capsuleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capsuleText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
