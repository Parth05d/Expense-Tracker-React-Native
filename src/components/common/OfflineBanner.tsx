import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WifiOff, CloudUpload } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';

export const OfflineBanner: React.FC = () => {
  const isOffline = useExpenseStore((state) => state.isOffline);
  const isSyncing = useExpenseStore((state) => state.isSyncing);
  const syncQueue = useExpenseStore((state) => state.syncQueue);
  const processSyncQueue = useExpenseStore((state) => state.processSyncQueue);
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const pendingCount = syncQueue.length;

  if (!isOffline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isOffline
            ? 'rgba(239, 68, 68, 0.15)'
            : isSyncing
            ? 'rgba(59, 130, 246, 0.15)'
            : 'rgba(245, 158, 11, 0.15)',
          borderColor: isOffline
            ? 'rgba(239, 68, 68, 0.3)'
            : isSyncing
            ? 'rgba(59, 130, 246, 0.3)'
            : 'rgba(245, 158, 11, 0.3)',
        },
      ]}
    >
      <View style={styles.contentLeft}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : isOffline ? (
          <WifiOff size={16} color="#EF4444" />
        ) : (
          <CloudUpload size={16} color="#F59E0B" />
        )}

        <Text
          style={[
            styles.bannerText,
            {
              color: isOffline
                ? '#EF4444'
                : isSyncing
                ? theme.primary
                : '#F59E0B',
            },
          ]}
        >
          {isSyncing
            ? 'Syncing changes...'
            : isOffline
            ? `Offline Mode ${pendingCount > 0 ? `(${pendingCount} pending)` : '• Saved locally'}`
            : `${pendingCount} unsynced change${pendingCount > 1 ? 's' : ''}`}
        </Text>
      </View>

      {!isSyncing && !isOffline && pendingCount > 0 && (
        <TouchableOpacity
          onPress={async () => {
            await processSyncQueue();
            if (useExpenseStore.getState().syncQueue.length > 0) {
              useExpenseStore.setState({ syncQueue: [], isSyncing: false, isOffline: false });
            }
          }}
          style={[styles.syncBtn, { backgroundColor: theme.primaryDim }]}
        >
          <Text style={[styles.syncBtnText, { color: theme.primary }]}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
