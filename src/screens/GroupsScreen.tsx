import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Users, Edit2 } from 'lucide-react-native';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../constants/theme';
import { useExpenseStore } from '../store/useExpenseStore';
import { calculateGroupBalances } from '../utils/splitCalc';
import { formatCurrency } from '../utils/currency';
import { CreateGroupModal } from '../components/groups/CreateGroupModal';
import { GroupDetailsModal } from '../components/groups/GroupDetailsModal';
import { CustomRefreshControl } from '../components/common/CustomRefreshControl';

interface GroupsScreenProps {
  onPressProfile: () => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({ onPressProfile }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const groups = useExpenseStore((state) => state.groups);
  const groupMembers = useExpenseStore((state) => state.groupMembers);
  const transactions = useExpenseStore((state) => state.transactions);
  const splits = useExpenseStore((state) => state.splits);
  const userId = useExpenseStore((state) => state.userId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const storeUserId = useExpenseStore.getState().userId;
    if (storeUserId) {
      await useExpenseStore.getState().fetchInitialData(storeUserId);
    }
    await useExpenseStore.getState().processSyncQueue();
    setRefreshing(false);
  }, []);

  const sharedGroups = groups.filter(g => g.type === 'shared');
  const familyGroups = groups.filter(g => g.type === 'family');

  const getGroupBalances = (groupId: string) => {
    const groupTxs = transactions.filter(t => t.groupId === groupId);
    const groupSplits = splits.filter(s => groupTxs.some(t => t.id === s.transactionId));
    return calculateGroupBalances(groupTxs, groupSplits);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Depth Orbs */}
      <View
        style={[
          styles.ambientOrbTopRight,
          {
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.1)',
          },
        ]}
      />
      <View
        style={[
          styles.ambientOrbLeftCenter,
          {
            backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.14)' : 'rgba(234, 88, 12, 0.08)',
          },
        ]}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Shared & Family</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primaryDim }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <CustomRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Shared Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Shared Groups</Text>
          
          {sharedGroups.length === 0 ? (
            <Text style={{ color: theme.textDim, padding: Spacing.md }}>No shared groups yet.</Text>
          ) : (
            sharedGroups.map(group => {
              const members = groupMembers.filter(m => m.groupId === group.id);
              const memberNames = members.map(m => m.userId === userId ? 'You' : (m.profile?.fullName || m.profile?.email || 'Unknown')).join(', ');
              const balances = getGroupBalances(group.id);
              
              const myOwed = balances.filter(b => b.fromUserId === userId); // I owe them
              const owedToMe = balances.filter(b => b.toUserId === userId); // They owe me
              
              return (
                <TouchableOpacity 
                  key={group.id} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedGroupId(group.id)}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.cardGlass,
                      borderColor: theme.glassHighlightTop,
                      ...ShadowPresets.glass,
                    },
                  ]}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupHeaderLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <Users size={20} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
                        <Text style={[styles.groupMembers, { color: theme.textMuted }]}>{memberNames}</Text>
                      </View>
                    </View>
                    <View style={[styles.editIconBadge, { backgroundColor: theme.secondary }]}>
                      <Edit2 size={14} color={theme.textMuted} />
                    </View>
                  </View>

                  <View style={[styles.balanceBox, { backgroundColor: theme.secondary }]}>
                    {myOwed.length === 0 && owedToMe.length === 0 && (
                      <Text style={{ color: theme.text, fontSize: 13, textAlign: 'center' }}>All settled up!</Text>
                    )}
                    
                    {myOwed.map((b, i) => {
                      const target = members.find(m => m.userId === b.toUserId);
                      const targetName = target?.profile?.fullName || target?.profile?.email || 'Unknown';
                      return (
                        <View key={`owe-${i}`} style={styles.balanceRow}>
                          <Text style={{ color: theme.text, fontSize: 13 }}>You owe {targetName}</Text>
                          <Text style={{ color: theme.destructive, fontSize: 13, fontWeight: '600' }}>{formatCurrency(b.amount, currency)}</Text>
                        </View>
                      );
                    })}

                    {owedToMe.map((b, i) => {
                      const target = members.find(m => m.userId === b.fromUserId);
                      const targetName = target?.profile?.fullName || target?.profile?.email || 'Unknown';
                      return (
                        <View key={`owed-${i}`} style={styles.balanceRow}>
                          <Text style={{ color: theme.text, fontSize: 13 }}>{targetName} owes you</Text>
                          <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>{formatCurrency(b.amount, currency)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Family Groups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Family Accounts</Text>
          
          {familyGroups.length === 0 ? (
            <Text style={{ color: theme.textDim, padding: Spacing.md }}>No family accounts yet.</Text>
          ) : (
            familyGroups.map(group => {
              const members = groupMembers.filter(m => m.groupId === group.id);
              return (
                <TouchableOpacity 
                  key={group.id} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedGroupId(group.id)}
                  style={[
                    styles.groupCard,
                    {
                      backgroundColor: theme.cardGlass,
                      borderColor: theme.glassHighlightTop,
                      ...ShadowPresets.glass,
                    },
                  ]}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupHeaderLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                        <Users size={20} color="#F97316" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
                        <Text style={[styles.groupMembers, { color: theme.textMuted }]}>Household Budget • Tap to Edit</Text>
                      </View>
                    </View>
                    <View style={[styles.editIconBadge, { backgroundColor: theme.secondary }]}>
                      <Edit2 size={14} color={theme.primary} />
                    </View>
                  </View>

                  <View style={styles.membersList}>
                    {members.map(member => {
                      const name = member.userId === userId ? 'You' : (member.profile?.fullName || member.profile?.email || 'Unknown');
                      const initial = name.charAt(0).toUpperCase();
                      return (
                        <View key={member.id} style={[styles.memberRow, { backgroundColor: theme.secondary }]}>
                          <View style={styles.memberRowLeft}>
                            <View style={[styles.avatarBox, { backgroundColor: theme.border }]}>
                              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>{initial}</Text>
                            </View>
                            <View>
                              <Text style={[styles.memberName, { color: theme.text }]}>{name} ({member.role})</Text>
                            </View>
                          </View>
                          <TouchableOpacity 
                            onPress={() => setSelectedGroupId(group.id)}
                            style={[styles.manageButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                          >
                            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '500' }}>Manage</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </CustomRefreshControl>

      <CreateGroupModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      <GroupDetailsModal
        visible={!!selectedGroupId}
        groupId={selectedGroupId}
        onClose={() => setSelectedGroupId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    pointerEvents: 'none',
  },
  ambientOrbLeftCenter: {
    position: 'absolute',
    top: 280,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  groupCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupMembers: {
    fontSize: 11,
    marginTop: 2,
  },
  balanceBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  membersList: {
    gap: Spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  memberRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '500',
  },
  manageButton: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  editIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
