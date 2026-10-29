import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { create } from 'zustand';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  AlertTriangle,
} from 'lucide-react-native';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { Button } from './Button';

export interface GlassAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface GlassAlertConfig {
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  buttons?: GlassAlertButton[];
}

interface GlassAlertState {
  visible: boolean;
  config: GlassAlertConfig | null;
  showAlert: (config: GlassAlertConfig) => void;
  hideAlert: () => void;
}

export const useGlassAlertStore = create<GlassAlertState>((set) => ({
  visible: false,
  config: null,
  showAlert: (config: GlassAlertConfig) => set({ visible: true, config }),
  hideAlert: () => set({ visible: false, config: null }),
}));

/**
 * Universal Glassmorphic Alert helper replacing native Alert.alert
 */
export const showGlassAlert = (
  title: string,
  message?: string,
  buttons?: GlassAlertButton[],
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info'
) => {
  useGlassAlertStore.getState().showAlert({
    title,
    message,
    buttons,
    type,
  });
};

export const GlassAlertModal: React.FC = () => {
  const visible = useGlassAlertStore((state) => state.visible);
  const config = useGlassAlertStore((state) => state.config);
  const hideAlert = useGlassAlertStore((state) => state.hideAlert);
  
  let isDarkMode = true;
  try {
    const { useExpenseStore } = require('../../store/useExpenseStore');
    isDarkMode = useExpenseStore.getState()?.settings?.isDarkMode ?? true;
  } catch (e) {}

  if (!visible || !config) return null;

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const alertType = config.type || (config.buttons && config.buttons.some((b) => b.style === 'destructive') ? 'warning' : 'info');

  const getIcon = () => {
    switch (alertType) {
      case 'success':
        return <CheckCircle2 size={32} color="#10B981" />;
      case 'error':
        return <AlertCircle size={32} color="#EF4444" />;
      case 'warning':
      case 'confirm':
        return <AlertTriangle size={32} color="#F59E0B" />;
      default:
        return <Info size={32} color={theme.primary} />;
    }
  };

  const getBadgeStyle = () => {
    switch (alertType) {
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981' };
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444' };
      case 'warning':
      case 'confirm':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', border: theme.primary };
    }
  };

  const badgeStyle = getBadgeStyle();
  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: 'OK', style: 'default' as const }];

  const handleButtonPress = (btn: GlassAlertButton) => {
    hideAlert();
    if (btn.onPress) {
      btn.onPress();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hideAlert}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
              ...ShadowPresets.glass,
            },
          ]}
        >
          {/* Top Sheen Line */}
          <View style={styles.glassSheenLine} />

          {/* Ambient Glow Orb */}
          <View
            style={[
              styles.ambientOrb,
              {
                backgroundColor: alertType === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : alertType === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)',
              },
            ]}
          />

          {/* Icon Badge */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: badgeStyle.bg,
                borderColor: badgeStyle.border,
              },
            ]}
          >
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>{config.title}</Text>

          {/* Subtitle / Message */}
          {!!config.message && (
            <Text style={[styles.message, { color: theme.textMuted }]}>{config.message}</Text>
          )}

          {/* Buttons Row / Column */}
          <View style={[styles.buttonContainer, buttons.length > 2 && styles.buttonContainerVertical]}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const variant = isDestructive ? 'danger' : isCancel ? 'secondary' : 'primary';

              return (
                <View key={idx} style={buttons.length > 2 ? styles.fullWidthBtnWrapper : styles.flexBtnWrapper}>
                  <Button
                    title={btn.text}
                    onPress={() => handleButtonPress(btn)}
                    variant={variant}
                    size="md"
                    isDarkMode={isDarkMode}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10000,
  },
  glassSheenLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    zIndex: 10,
  },
  ambientOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    pointerEvents: 'none',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    zIndex: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
    zIndex: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
    zIndex: 2,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  flexBtnWrapper: {
    flex: 1,
  },
  fullWidthBtnWrapper: {
    width: '100%',
  },
});
