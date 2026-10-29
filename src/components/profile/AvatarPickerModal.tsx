import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { X, Check, Image as ImageIcon, Sparkles, Camera } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { showGlassAlert } from '../common/GlassAlert';
import { AvatarImage } from '../common/AvatarImage';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PRESET_AVATARS = [
  {
    id: 'avatar-default',
    name: 'Default User',
    url: '',
    color: '#475569',
  },
  {
    id: 'avatar-otter',
    name: 'Otter',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#0D9488"/><circle cx="32" cy="38" r="8" fill="#D97706"/><circle cx="68" cy="38" r="8" fill="#D97706"/><ellipse cx="50" cy="52" rx="22" ry="26" fill="#FDE68A"/><circle cx="43" cy="44" r="3" fill="#1E293B"/><circle cx="57" cy="44" r="3" fill="#1E293B"/><ellipse cx="50" cy="49" rx="5" ry="3.5" fill="#78350F"/><path d="M 46 54 Q 50 57 54 54" stroke="#78350F" stroke-width="2.5" fill="none"/></svg>`,
    color: '#0D9488',
  },
  {
    id: 'avatar-bear',
    name: 'Bear',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#F59E0B"/><circle cx="28" cy="28" r="10" fill="#B45309"/><circle cx="72" cy="28" r="10" fill="#B45309"/><circle cx="28" cy="28" r="6" fill="#FDE68A"/><circle cx="72" cy="28" r="6" fill="#FDE68A"/><ellipse cx="50" cy="56" rx="24" ry="20" fill="#FDE68A"/><circle cx="41" cy="44" r="3.5" fill="#1E293B"/><circle cx="59" cy="44" r="3.5" fill="#1E293B"/><ellipse cx="50" cy="50" rx="6" ry="4" fill="#451A03"/><path d="M 46 56 Q 50 60 54 56" stroke="#451A03" stroke-width="2.5" fill="none"/></svg>`,
    color: '#F59E0B',
  },
  {
    id: 'avatar-hedgehog',
    name: 'Hedgehog',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#D97706"/><path d="M 20 40 Q 50 15 80 40 Q 90 70 50 85 Q 10 70 20 40 Z" fill="#78350F"/><ellipse cx="50" cy="58" rx="22" ry="18" fill="#FEF3C7"/><circle cx="40" cy="52" r="3.5" fill="#1E293B"/><circle cx="60" cy="52" r="3.5" fill="#1E293B"/><ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#451A03"/><path d="M 45 64 Q 50 67 55 64" stroke="#451A03" stroke-width="2" fill="none"/></svg>`,
    color: '#D97706',
  },
  {
    id: 'avatar-astronaut',
    name: 'Astronaut',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#6366F1"/><rect x="25" y="25" width="50" height="50" rx="25" fill="#F8FAFC"/><rect x="32" y="32" width="36" height="28" rx="14" fill="#0F172A"/><path d="M 36 36 Q 44 34 52 38" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
    color: '#6366F1',
  },
  {
    id: 'avatar-ninja',
    name: 'Ninja',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#EF4444"/><circle cx="50" cy="50" r="34" fill="#1E293B"/><path d="M 24 40 C 24 35 76 35 76 40 L 76 56 C 76 61 24 61 24 56 Z" fill="#FDE68A"/><ellipse cx="38" cy="48" rx="3.5" ry="4" fill="#0F172A"/><ellipse cx="62" cy="48" rx="3.5" ry="4" fill="#0F172A"/><rect x="20" y="36" width="60" height="6" fill="#EF4444"/></svg>`,
    color: '#EF4444',
  },
  {
    id: 'avatar-yeti',
    name: 'Yeti',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#38BDF8"/><path d="M 22 45 C 22 20 78 20 78 45 L 82 80 C 82 88 18 88 18 80 Z" fill="#F1F5F9"/><ellipse cx="50" cy="48" rx="20" ry="14" fill="#38BDF8"/><circle cx="41" cy="48" r="3" fill="#0F172A"/><circle cx="59" cy="48" r="3" fill="#0F172A"/><path d="M 43 55 L 45 60 L 47 55 M 53 55 L 55 60 L 57 55" fill="#FFFFFF"/></svg>`,
    color: '#38BDF8',
  },
  {
    id: 'avatar-dino',
    name: 'Dino',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#10B981"/><path d="M 25 35 C 25 20 75 20 75 35 L 75 55 C 75 75 25 75 25 55 Z" fill="#059669"/><ellipse cx="50" cy="62" rx="16" ry="14" fill="#A7F3D0"/><circle cx="40" cy="42" r="4" fill="#1E293B"/><circle cx="60" cy="42" r="4" fill="#1E293B"/><ellipse cx="40" cy="40" rx="1.5" ry="1.5" fill="#FFFFFF"/><ellipse cx="60" cy="40" rx="1.5" ry="1.5" fill="#FFFFFF"/><path d="M 38 52 Q 50 57 62 52" stroke="#064E3B" stroke-width="2.5" fill="none"/></svg>`,
    color: '#10B981',
  },
  {
    id: 'avatar-coffee',
    name: 'Coffee',
    url: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#0D9488"/><path d="M 30 38 L 70 38 L 65 72 C 65 77 35 77 35 72 Z" fill="#FFFFFF"/><path d="M 70 44 Q 82 44 82 54 Q 82 64 67 64" stroke="#FFFFFF" stroke-width="5" fill="none"/><path d="M 40 28 Q 44 20 40 14 M 50 28 Q 54 20 50 14 M 60 28 Q 64 20 60 14" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
    color: '#0D9488',
  },
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ visible, onClose }) => {
  const settings = useExpenseStore((state) => state.settings);
  const updateSettings = useExpenseStore((state) => state.updateSettings);

  const isDarkMode = settings.isDarkMode;
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const [selectedUrl, setSelectedUrl] = useState<string>(settings.avatarUrl || '');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const handleSelectPreset = (url: string) => {
    setSelectedUrl(url);
  };

  const handleSave = () => {
    const finalUrl = showCustomInput ? customInputUrl.trim() : selectedUrl;
    updateSettings({ avatarUrl: finalUrl });
    showGlassAlert('Avatar Updated', 'Your profile photo has been updated successfully.', undefined, 'success');
    onClose();
  };

  const handleRemoveAvatar = () => {
    setSelectedUrl('');
    setCustomInputUrl('');
    updateSettings({ avatarUrl: '' });
    showGlassAlert('Avatar Reset', 'Profile photo restored to default avatar.', undefined, 'info');
    onClose();
  };

  const handlePickFromGallery = async () => {
    // 1. Web runtime: Use native HTML file picker to select from photo gallery
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (event: any) => {
          const file = event.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              if (result) {
                setSelectedUrl(result);
                setShowCustomInput(false);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      } catch (err) {
        // Fallback below
      }
    }

    // 2. Native Expo runtime: Use expo-image-picker module
    try {
      const ImagePicker = require('expo-image-picker');
      if (ImagePicker && typeof ImagePicker.launchImageLibraryAsync === 'function') {
        if (typeof ImagePicker.requestMediaLibraryPermissionsAsync === 'function') {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            showGlassAlert('Permission Needed', 'Please allow gallery access to select a profile photo.', undefined, 'warning');
            return;
          }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0].uri) {
          setSelectedUrl(result.assets[0].uri);
          setShowCustomInput(false);
          return;
        }
        // User cancelled selection - stay on current view without redirecting
        return;
      }
    } catch (e) {
      showGlassAlert(
        'Rebuild Required for Native Gallery',
        'Native gallery picker requires rebuilding the APK with eas build or expo run:android.',
        undefined,
        'warning'
      );
    }

    setShowCustomInput(true);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerTitleRow}>
                  <Sparkles size={18} color={theme.primary} />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Choose Profile Avatar</Text>
                </View>

                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.secondary }]}>
                  <X size={16} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Live Preview Circle */}
              <View style={styles.previewContainer}>
                <View style={[styles.avatarPreviewWrapper, { borderColor: theme.primary }]}>
                  <AvatarImage url={selectedUrl} size={74} fallbackColor={theme.primaryDim} iconColor={theme.primary} />
                  <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
                    <Camera size={12} color="#FFF" />
                  </View>
                </View>

                <Text style={[styles.previewName, { color: theme.text }]}>
                  {settings.userName || 'Your Name'}
                </Text>
              </View>

              {/* Action Buttons: Presets, Gallery, Web URL & Remove */}
              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  onPress={() => setShowCustomInput(false)}
                  style={[
                    styles.quickActionBtn,
                    !showCustomInput
                      ? { backgroundColor: theme.primaryDim, borderColor: theme.primary }
                      : { backgroundColor: theme.secondary, borderColor: theme.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <Sparkles size={13} color={!showCustomInput ? theme.primary : theme.textMuted} />
                  <Text style={[styles.quickActionBtnText, { color: !showCustomInput ? theme.primary : theme.textMuted }]}>
                    Presets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={[styles.quickActionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={13} color={theme.text} />
                  <Text style={[styles.quickActionBtnText, { color: theme.text }]}>
                    From Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCustomInput(true)}
                  style={[
                    styles.quickActionBtn,
                    showCustomInput
                      ? { backgroundColor: theme.primaryDim, borderColor: theme.primary }
                      : { backgroundColor: theme.secondary, borderColor: theme.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickActionBtnText, { color: showCustomInput ? theme.primary : theme.textMuted }]}>
                    Image URL
                  </Text>
                </TouchableOpacity>

                {!!settings.avatarUrl && (
                  <TouchableOpacity
                    onPress={handleRemoveAvatar}
                    style={[styles.quickActionBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.quickActionBtnText, { color: theme.destructive }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Custom URL Input Field (Toggleable) */}
              {showCustomInput ? (
                <View style={styles.customInputSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Custom Image Web URL</Text>
                  <TextInput
                    style={[styles.urlInput, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                    placeholder="https://example.com/photo.jpg"
                    placeholderTextColor={theme.textMuted}
                    value={customInputUrl}
                    onChangeText={(text) => {
                      setCustomInputUrl(text);
                      if (text.trim().startsWith('http') || text.trim().startsWith('file:')) {
                        setSelectedUrl(text.trim());
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              ) : (
                /* Preset Avatars Grid */
                <View style={styles.presetSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Curated Avatars</Text>

                  <ScrollView contentContainerStyle={styles.presetsGrid} showsVerticalScrollIndicator={false}>
                    {PRESET_AVATARS.map((avatar) => {
                      const isSelected = selectedUrl === avatar.url;

                      return (
                        <TouchableOpacity
                          key={avatar.id}
                          onPress={() => handleSelectPreset(avatar.url)}
                          style={[
                            styles.avatarChip,
                            {
                              borderColor: isSelected ? theme.primary : theme.border,
                              backgroundColor: avatar.color || theme.secondary,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <AvatarImage url={avatar.url} size={62} fallbackColor="#334155" iconColor="#94A3B8" />
                          {isSelected && (
                            <View style={[styles.selectedCheckOverlay, { backgroundColor: 'rgba(16, 185, 129, 0.80)' }]}>
                              <Check size={16} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Save Footer Button */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Save Avatar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...ShadowPresets.glass,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  avatarPreviewWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarFallback: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  customInputSection: {
    marginVertical: Spacing.xs,
  },
  urlInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 13,
  },
  presetSection: {
    marginVertical: Spacing.xs,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  avatarChip: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  defaultAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  selectedCheckOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: Spacing.xs,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
