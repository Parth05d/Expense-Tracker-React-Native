import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius } from '../../constants/theme';
import { Button } from '../common/Button';

interface CreateCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income';
}

const PRESET_ICONS = ['🍔', '🛒', '🚕', '⚡', '🎮', '🎬', '🏥', '📚', '👕', '✈️', '🎁', '🐶', '🔧', '💰', '💼', '📈'];
const PRESET_COLORS = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EAB308', '#EF4444', '#14B8A6'];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  visible,
  onClose,
  defaultType = 'expense',
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const createCategory = useExpenseStore((state) => state.createCategory);
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(PRESET_ICONS[0]);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<'expense' | 'income'>(defaultType);

  const handleSave = async () => {
    if (!name.trim()) return;

    await createCategory({
      name: name.trim(),
      icon,
      color,
      type,
      isEssential: false,
    });
    
    // Reset and close
    setName('');
    setIcon(PRESET_ICONS[0]);
    setColor(PRESET_COLORS[0]);
    setType(defaultType);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>New Category</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                onPress={() => setType('expense')}
                style={[styles.typeTab, type === 'expense' ? { backgroundColor: '#EF4444', borderColor: '#EF4444' } : { backgroundColor: theme.secondary, borderColor: theme.border }]}
              >
                <Text style={{ color: type === 'expense' ? '#FFFFFF' : theme.textMuted, fontWeight: '700' }}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType('income')}
                style={[styles.typeTab, type === 'income' ? { backgroundColor: '#10B981', borderColor: '#10B981' } : { backgroundColor: theme.secondary, borderColor: theme.border }]}
              >
                <Text style={{ color: type === 'income' ? '#FFFFFF' : theme.textMuted, fontWeight: '700' }}>Income</Text>
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Gaming, Subscriptions..."
                placeholderTextColor={theme.textDim}
                style={[styles.input, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
              />
            </View>

            {/* Icon Picker */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Icon</Text>
              <View style={styles.grid}>
                {PRESET_ICONS.map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setIcon(i)}
                    style={[
                      styles.gridItem,
                      { backgroundColor: icon === i ? theme.border : theme.secondary, borderColor: icon === i ? theme.primary : theme.border }
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{i}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Picker */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Color</Text>
              <View style={styles.grid}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.colorItem, { backgroundColor: c, borderColor: theme.surface, borderWidth: 3 }]}
                  >
                    {color === c && <Check size={16} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <Button title="Create Category" onPress={handleSave} size="lg" disabled={!name.trim()} />
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)' },
  sheet: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingTop: Spacing.md, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl },
  typeSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  typeTab: { flex: 1, paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  section: { marginBottom: Spacing.xl },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { height: 48, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: 48, height: 48, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  colorItem: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', margin: 4 },
  footer: { marginTop: Spacing.sm },
});
