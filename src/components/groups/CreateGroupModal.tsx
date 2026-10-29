import React, { useState } from 'react';
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
} from 'react-native';
import { X, Users, Home } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from '../common/Button';
import { showGlassAlert } from '../common/GlassAlert';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const createGroup = useExpenseStore((state) => state.createGroup);
  const addMemberToGroup = useExpenseStore((state) => state.addMemberToGroup);

  const [name, setName] = useState('');
  const [type, setType] = useState<'shared' | 'family'>('shared');
  const [emails, setEmails] = useState<string>(''); // Comma separated emails for v1
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showGlassAlert('Missing Name', 'Please enter a group name.', undefined, 'error');
      return;
    }

    setIsSubmitting(true);
    const newGroup = await createGroup(name.trim(), type);
    
    if (newGroup && emails.trim()) {
      // Process email invites
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
      for (const email of emailList) {
        // Just default to 'adult' role for family, 'admin' for shared for simplicity
        const role = type === 'family' ? 'adult' : 'admin';
        await addMemberToGroup(newGroup.id, email, role);
      }
    }

    setIsSubmitting(false);
    if (newGroup) {
      setName('');
      setEmails('');
      onClose();
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
          <View style={[styles.sheet, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.title, { color: theme.text }]}>Create Group</Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content} 
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  onPress={() => setType('shared')}
                  style={[
                    styles.typeCard,
                    { backgroundColor: type === 'shared' ? 'rgba(59, 130, 246, 0.1)' : theme.secondary, borderColor: type === 'shared' ? '#3B82F6' : theme.border }
                  ]}
                >
                  <Users size={24} color={type === 'shared' ? '#3B82F6' : theme.textMuted} />
                  <Text style={[styles.typeTitle, { color: type === 'shared' ? '#3B82F6' : theme.text }]}>Shared</Text>
                  <Text style={[styles.typeDesc, { color: theme.textMuted }]}>Roommates, Trips</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setType('family')}
                  style={[
                    styles.typeCard,
                    { backgroundColor: type === 'family' ? 'rgba(249, 115, 22, 0.1)' : theme.secondary, borderColor: type === 'family' ? '#F97316' : theme.border }
                  ]}
                >
                  <Home size={24} color={type === 'family' ? '#F97316' : theme.textMuted} />
                  <Text style={[styles.typeTitle, { color: type === 'family' ? '#F97316' : theme.text }]}>Family</Text>
                  <Text style={[styles.typeDesc, { color: theme.textMuted }]}>Household Budget</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Group Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={type === 'shared' ? 'e.g. Miami Trip' : 'e.g. Smith Family'}
                  placeholderTextColor={theme.textDim}
                  style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Invite Members (Emails)</Text>
                <TextInput
                  value={emails}
                  onChangeText={setEmails}
                  placeholder="email1@test.com, email2@test.com"
                  placeholderTextColor={theme.textDim}
                  style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={{ color: theme.textDim, fontSize: 11, marginTop: 4 }}>
                  Separate multiple emails with commas. Users must already have an account.
                </Text>
              </View>

              <Button
                title={isSubmitting ? "Creating..." : "Create Group"}
                onPress={handleSave}
                disabled={isSubmitting}
                style={{ marginTop: Spacing.xl }}
              />
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
  content: { padding: Spacing.lg },
  typeSelector: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  typeCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', gap: Spacing.xs },
  typeTitle: { fontSize: 15, fontWeight: '600' },
  typeDesc: { fontSize: 11 },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { height: 48, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 15 },
});
