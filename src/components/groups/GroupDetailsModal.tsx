import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Trash2, UserMinus, UserPlus } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from '../common/Button';
import { Group } from '../../types';
import { showGlassAlert } from '../common/GlassAlert';

interface GroupDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  visible,
  onClose,
  groupId,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const userId = useExpenseStore((state) => state.userId);
  
  const groups = useExpenseStore((state) => state.groups);
  const groupMembers = useExpenseStore((state) => state.groupMembers);
  
  const updateGroup = useExpenseStore((state) => state.updateGroup);
  const deleteGroup = useExpenseStore((state) => state.deleteGroup);
  const removeMemberFromGroup = useExpenseStore((state) => state.removeMemberFromGroup);
  const addMemberToGroup = useExpenseStore((state) => state.addMemberToGroup);

  const group = groups.find(g => g.id === groupId);
  const members = groupMembers.filter(m => m.groupId === groupId);
  
  const currentUserRole = members.find(m => m.userId === userId)?.role;
  const isCreator = group?.createdBy === userId;
  const isAdmin = isCreator || currentUserRole === 'admin' || currentUserRole === 'adult' || group?.type === 'family';

  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name);
    }
  }, [group]);

  if (!group) return null;

  const handleSaveName = async () => {
    if (!name.trim()) return;
    await updateGroup(group.id, name.trim());
    setIsEditingName(false);
  };

  const handleDeleteGroup = () => {
    showGlassAlert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This will remove all members, but keep transactions as personal expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(group.id);
            onClose();
          }
        }
      ],
      'warning'
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    showGlassAlert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            await removeMemberFromGroup(memberId);
          }
        }
      ],
      'warning'
    );
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    setIsAddingMember(true);
    const role = group.type === 'family' ? 'adult' : 'admin';
    const success = await addMemberToGroup(group.id, newMemberEmail.trim(), role);
    setIsAddingMember(false);
    if (success) {
      setNewMemberEmail('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
          style={styles.keyboardView}
        >
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              {isAdmin ? (
                <TouchableOpacity onPress={handleDeleteGroup} style={styles.deleteButton}>
                  <Trash2 size={20} color={theme.destructive} />
                </TouchableOpacity>
              ) : <View style={{ width: 40 }} />}
              
              <Text style={[styles.title, { color: theme.text }]}>Group Details</Text>
              
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.secondary }]}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content} 
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Name Edit Section */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Group Name</Text>
                
                {isEditingName ? (
                  <View style={styles.editNameRow}>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border, flex: 1 }]}
                      autoFocus
                    />
                    <TouchableOpacity 
                      onPress={handleSaveName}
                      style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    >
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.editNameRow}>
                    <Text style={[styles.groupNameDisplay, { color: theme.text, flex: 1 }]}>{group.name}</Text>
                    {isAdmin && (
                      <TouchableOpacity onPress={() => setIsEditingName(true)} style={[styles.editButton, { borderColor: theme.border }]}>
                        <Text style={{ color: theme.primary, fontWeight: '500' }}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Members Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.label, { color: theme.textMuted }]}>Members ({members.length})</Text>
                </View>
                
                <View style={[styles.membersList, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                  {members.map((member, index) => {
                    const isMe = member.userId === userId;
                    const displayName = isMe ? 'You' : (member.profile?.fullName || member.profile?.email || 'Unknown User');
                    const isLast = index === members.length - 1;
                    
                    return (
                      <View key={member.id} style={[styles.memberRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{displayName}</Text>
                          {member.profile?.email && displayName !== member.profile.email && (
                            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{member.profile.email}</Text>
                          )}
                          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{member.role}</Text>
                        </View>
                        
                        {isAdmin && !isMe && (
                          <TouchableOpacity 
                            onPress={() => handleRemoveMember(member.id, displayName)}
                            style={styles.removeMemberBtn}
                          >
                            <UserMinus size={18} color={theme.destructive} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
                
                {isAdmin && (
                  <View style={styles.addMemberContainer}>
                    <TextInput
                      value={newMemberEmail}
                      onChangeText={setNewMemberEmail}
                      placeholder="Add member by email..."
                      placeholderTextColor={theme.textDim}
                      style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border, flex: 1 }]}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <TouchableOpacity 
                      onPress={handleAddMember}
                      disabled={isAddingMember || !newMemberEmail.trim()}
                      style={[
                        styles.addMemberBtn, 
                        { backgroundColor: newMemberEmail.trim() ? theme.primary : theme.secondary }
                      ]}
                    >
                      {isAddingMember ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <UserPlus size={20} color={newMemberEmail.trim() ? '#FFF' : theme.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={{ color: theme.textDim, fontSize: 12, textAlign: 'center', marginTop: Spacing.xl }}>
                Created on {new Date(group.createdAt).toLocaleDateString()}
              </Text>
              
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  keyboardView: { width: '100%', maxHeight: '90%' },
  sheet: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingTop: Spacing.md, height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '600' },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  editNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  input: { height: 44, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 16 },
  saveButton: { height: 44, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  groupNameDisplay: { fontSize: 20, fontWeight: '600' },
  editButton: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.md, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  membersList: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  removeMemberBtn: { padding: 8 },
  addMemberContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  addMemberBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
});
