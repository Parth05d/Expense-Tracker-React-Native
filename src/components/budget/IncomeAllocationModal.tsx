import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  X,
  PieChart,
  Check,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  FolderPlus,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../common/Button';
import { CreateCategoryModal } from '../categories/CreateCategoryModal';
import { Category } from '../../types';

interface IncomeAllocationModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_PCT_CHIPS = [5, 10, 15, 20, 25, 30, 40, 50];

export const IncomeAllocationModal: React.FC<IncomeAllocationModalProps> = ({
  visible,
  onClose,
}) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const currency = useExpenseStore((state) => state.settings.currency);
  const settings = useExpenseStore((state) => state.settings);
  const categories = useExpenseStore((state) => state.categories);
  const updateIncomeAllocations = useExpenseStore((state) => state.updateIncomeAllocations);
  const applyPresetAllocations = useExpenseStore((state) => state.applyPresetAllocations);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const monthlyIncome = settings.monthlyIncomeTarget || settings.monthlyIncome || 50000;

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Local allocation state map: categoryId -> percentage
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  // List of active category IDs in allocation
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  // Category Picker Drawer
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);

  useEffect(() => {
    if (visible) {
      const existing = settings.incomeAllocations || {};
      const initialMap: Record<string, number> = {};
      const activeIds: string[] = [];

      expenseCategories.forEach((c) => {
        if (existing[c.id] !== undefined) {
          initialMap[c.id] = existing[c.id];
          activeIds.push(c.id);
        } else {
          initialMap[c.id] = 0;
          activeIds.push(c.id);
        }
      });

      setAllocations(initialMap);
      setActiveCategoryIds(activeIds);
    }
  }, [visible, settings.incomeAllocations, categories]);

  const activeCategories = expenseCategories.filter((c) => activeCategoryIds.includes(c.id));
  const unallocatedCategories = expenseCategories.filter((c) => !activeCategoryIds.includes(c.id));

  // Compute Total Allocated % and Multi-Segment Bar Slices
  const { totalPercent, segments } = useMemo(() => {
    let sum = 0;
    const segs: { id: string; name: string; color: string; pct: number }[] = [];

    activeCategories.forEach((c) => {
      const pct = allocations[c.id] || 0;
      sum += pct;
      if (pct > 0) {
        segs.push({
          id: c.id,
          name: c.name,
          color: c.color || theme.primary,
          pct,
        });
      }
    });

    return {
      totalPercent: sum,
      segments: segs,
    };
  }, [activeCategories, allocations, theme.primary]);

  const handlePercentChange = (categoryId: string, delta: number) => {
    setAllocations((prev) => {
      const current = prev[categoryId] || 0;
      const next = Math.max(0, Math.min(100, current + delta));
      return { ...prev, [categoryId]: next };
    });
  };

  const handleSetDirectPercent = (categoryId: string, val: number) => {
    setAllocations((prev) => ({
      ...prev,
      [categoryId]: Math.max(0, Math.min(100, val)),
    }));
  };

  const handleRemoveCategory = (categoryId: string) => {
    setActiveCategoryIds((prev) => prev.filter((id) => id !== categoryId));
    setAllocations((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const handleAddCategoryToAllocation = (category: Category) => {
    if (!activeCategoryIds.includes(category.id)) {
      setActiveCategoryIds((prev) => [...prev, category.id]);
      setAllocations((prev) => ({ ...prev, [category.id]: 0 }));
    }
    setShowAddPicker(false);
  };

  const handleApplyPreset = async (preset: '50/30/20' | '60/20/20' | 'equal') => {
    await applyPresetAllocations(preset);
    const updated = useExpenseStore.getState().settings.incomeAllocations || {};
    setAllocations(updated);
    setActiveCategoryIds(Object.keys(updated));
  };

  // Custom Notice State
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
    isError?: boolean;
    onDone?: () => void;
  } | null>(null);

  const handleSave = async () => {
    if (totalPercent > 100) {
      setNotice({
        title: 'Allocation Exceeded',
        message: `Total allocated is ${totalPercent}%. Please reduce by ${totalPercent - 100}% so total equals 100%.`,
        isError: true,
      });
      return;
    }

    await updateIncomeAllocations(allocations, true);
    setNotice({
      title: 'Allocations Saved',
      message: 'Your income distribution plan has been saved and applied to your monthly category budgets!',
      onDone: () => {
        setNotice(null);
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Glassmorphic Sheet Modal Body */}
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
              borderLeftColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              ...ShadowPresets.glass,
            },
          ]}
        >
          {/* Specular Glass Sheen Top Edge */}
          <View style={styles.glassSheenLine} />

          {/* Ambient Background Gradient Orbs */}
          <View
            style={[
              styles.modalOrbTopRight,
              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' },
            ]}
          />
          <View
            style={[
              styles.modalOrbBottomLeft,
              { backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.1)' },
            ]}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryDim }]}>
                <PieChart size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Income % Allocator</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Monthly Income: {formatCurrency(monthlyIncome, currency, { hideDecimals: true })}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.secondary }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Multi-Color Allocation Stacked Bar Gauge */}
          <View
            style={[
              styles.allocationGaugeCard,
              {
                backgroundColor: theme.cardGlass,
                borderColor: theme.borderSubtle,
                borderTopColor: theme.glassHighlightTop,
              },
            ]}
          >
            <View style={styles.gaugeHeader}>
              <View style={styles.gaugeTitleRow}>
                <Zap size={14} color={totalPercent === 100 ? theme.primary : totalPercent > 100 ? theme.destructive : theme.textMuted} />
                <Text style={[styles.gaugeTitle, { color: theme.text }]}>
                  Total Allocated: <Text style={{ color: totalPercent === 100 ? theme.primary : totalPercent > 100 ? theme.destructive : theme.text, fontWeight: '800' }}>{totalPercent}%</Text>
                </Text>
              </View>
              <Text style={[styles.gaugeSub, { color: totalPercent === 100 ? theme.primary : totalPercent > 100 ? theme.destructive : theme.textMuted }]}>
                {totalPercent === 100 ? '100% Balanced' : totalPercent > 100 ? `${totalPercent - 100}% Exceeded` : `${100 - totalPercent}% Unallocated`}
              </Text>
            </View>

            {/* Stacked Color Bar */}
            <View style={styles.stackedBarTrack}>
              {segments.map((seg) => (
                <View
                  key={seg.id}
                  style={[
                    styles.stackedBarSegment,
                    {
                      width: `${seg.pct}%`,
                      backgroundColor: seg.color,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetSection}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Apply Preset Rules:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: theme.cardGlass,
                    borderColor: theme.borderSubtle,
                    borderTopColor: theme.glassHighlightTop,
                  },
                ]}
                onPress={() => handleApplyPreset('50/30/20')}
              >
                <Sparkles size={16} color={theme.primary} />
                <View>
                  <Text style={[styles.presetCardTitle, { color: theme.text }]}>50/30/20 Rule</Text>
                  <Text style={[styles.presetCardSub, { color: theme.textMuted }]}>50% Needs • 30% Wants • 20% Save</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: theme.cardGlass,
                    borderColor: theme.borderSubtle,
                    borderTopColor: theme.glassHighlightTop,
                  },
                ]}
                onPress={() => handleApplyPreset('60/20/20')}
              >
                <ShieldCheck size={16} color="#3B82F6" />
                <View>
                  <Text style={[styles.presetCardTitle, { color: theme.text }]}>60/20/20 Rule</Text>
                  <Text style={[styles.presetCardSub, { color: theme.textMuted }]}>60% Needs • 20% Wants • 20% Save</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: theme.cardGlass,
                    borderColor: theme.borderSubtle,
                    borderTopColor: theme.glassHighlightTop,
                  },
                ]}
                onPress={() => handleApplyPreset('equal')}
              >
                <PieChart size={16} color="#8B5CF6" />
                <View>
                  <Text style={[styles.presetCardTitle, { color: theme.text }]}>Equal Split</Text>
                  <Text style={[styles.presetCardSub, { color: theme.textMuted }]}>Evenly across categories</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Category Allocation Frosted Cards List */}
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {activeCategories.map((cat) => {
              const pct = allocations[cat.id] || 0;
              const allocatedAmount = Math.round((monthlyIncome * pct) / 100);

              return (
                <View
                  key={cat.id}
                  style={[
                    styles.catCard,
                    {
                      backgroundColor: theme.cardGlass,
                      borderColor: theme.borderSubtle,
                      borderTopColor: theme.glassHighlightTop,
                      borderLeftColor: theme.glassHighlightLeft,
                    },
                  ]}
                >
                  <View style={styles.glassSheenLine} />

                  {/* Category Top Row */}
                  <View style={styles.catTopRow}>
                    <View style={styles.catLeftInfo}>
                      <View style={[styles.catIconBox, { backgroundColor: (cat.color || theme.primary) + '25' }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                      <View>
                        <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
                        <Text style={[styles.catAmountText, { color: theme.primary }]}>
                          {formatCurrency(allocatedAmount, currency, { hideDecimals: true })} / mo
                        </Text>
                      </View>
                    </View>

                    <View style={styles.catRightActions}>
                      <View style={[styles.percentageBadge, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                        <TextInput
                          style={[styles.percentageInputText, { color: theme.text }]}
                          keyboardType="numeric"
                          value={String(pct)}
                          onChangeText={(txt) => handleSetDirectPercent(cat.id, parseInt(txt, 10) || 0)}
                        />
                        <Text style={[styles.percentageSignText, { color: theme.primary }]}>%</Text>
                      </View>

                      {/* Trash Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveCategory(cat.id)}
                        style={[styles.trashBtn, { backgroundColor: theme.destructiveDim }]}
                      >
                        <Trash2 size={14} color={theme.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Percentage Quick Step Chips */}
                  <View style={styles.chipsRow}>
                    {QUICK_PCT_CHIPS.map((chipVal) => {
                      const isSelected = pct === chipVal;
                      return (
                        <TouchableOpacity
                          key={chipVal}
                          onPress={() => handleSetDirectPercent(cat.id, chipVal)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.secondary,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#FFFFFF' : theme.textMuted },
                            ]}
                          >
                            {chipVal}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Add Category Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAddPicker(true)}
              style={[
                styles.addCategoryBtn,
                {
                  backgroundColor: theme.cardGlass,
                  borderColor: theme.glassHighlightTop,
                },
              ]}
            >
              <Plus size={18} color={theme.primary} />
              <Text style={[styles.addCategoryBtnText, { color: theme.primary }]}>
                + Add Category to Allocation Plan
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Save Action */}
          <View style={styles.footer}>
            <Button
              title="Apply & Save Allocations"
              onPress={handleSave}
              variant="primary"
              size="lg"
            />
          </View>

          {/* Add Category Drawer Modal */}
          <Modal visible={showAddPicker} transparent animationType="fade" onRequestClose={() => setShowAddPicker(false)}>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <View style={styles.pickerHeader}>
                  <Text style={[styles.pickerTitle, { color: theme.text }]}>Select Category to Allocate</Text>
                  <TouchableOpacity onPress={() => setShowAddPicker(false)}>
                    <X size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
                  {unallocatedCategories.length === 0 ? (
                    <Text style={[styles.noUnallocatedText, { color: theme.textMuted }]}>
                      All categories are already added to your allocation plan.
                    </Text>
                  ) : (
                    unallocatedCategories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => handleAddCategoryToAllocation(c)}
                        style={[styles.pickerItem, { backgroundColor: theme.secondary }]}
                      >
                        <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                        <Text style={[styles.pickerItemText, { color: theme.text }]}>{c.name}</Text>
                        <Plus size={16} color={theme.primary} />
                      </TouchableOpacity>
                    ))
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      setShowAddPicker(false);
                      setShowCreateCategoryModal(true);
                    }}
                    style={[styles.createNewCategoryBtn, { backgroundColor: theme.primaryDim }]}
                  >
                    <FolderPlus size={18} color={theme.primary} />
                    <Text style={[styles.createNewCategoryText, { color: theme.primary }]}>
                      + Create New Category (e.g. Investments)
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Create Category Modal */}
          <CreateCategoryModal
            visible={showCreateCategoryModal}
            onClose={() => setShowCreateCategoryModal(false)}
            defaultType="expense"
          />

          {/* Centered Glassmorphic Custom Notice Feedback Modal */}
          <Modal
            visible={!!notice}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              if (notice?.onDone) notice.onDone();
              else setNotice(null);
            }}
          >
            <View style={styles.noticeOverlay}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.noticeBackdrop}
                onPress={() => {
                  if (notice?.onDone) notice.onDone();
                  else setNotice(null);
                }}
              />
              <View
                style={[
                  styles.noticeCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: notice?.isError ? theme.destructive : theme.primary,
                    ...ShadowPresets.glass,
                  },
                ]}
              >
                <View
                  style={[
                    styles.noticeIconBadge,
                    {
                      backgroundColor: notice?.isError
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                      borderColor: notice?.isError ? '#EF4444' : '#10B981',
                    },
                  ]}
                >
                  {notice?.isError ? (
                    <AlertCircle size={32} color="#EF4444" />
                  ) : (
                    <CheckCircle2 size={32} color="#10B981" />
                  )}
                </View>

                <Text style={[styles.noticeTitle, { color: theme.text }]}>
                  {notice?.title}
                </Text>

                <Text style={[styles.noticeMessage, { color: theme.textMuted }]}>
                  {notice?.message}
                </Text>

                <View style={styles.noticeActions}>
                  <Button
                    title="Got It"
                    onPress={() => {
                      if (notice?.onDone) notice.onDone();
                      else setNotice(null);
                    }}
                    variant="primary"
                    size="md"
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    maxHeight: '90%',
    padding: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
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
  modalOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    pointerEvents: 'none',
  },
  modalOrbBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationGaugeCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 8,
    zIndex: 2,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gaugeTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  gaugeSub: {
    fontSize: 12,
    fontWeight: '700',
  },
  stackedBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stackedBarSegment: {
    height: '100%',
  },
  presetSection: {
    marginBottom: Spacing.md,
    gap: 6,
    zIndex: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetRow: {
    gap: Spacing.sm,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  presetCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetCardSub: {
    fontSize: 10,
    marginTop: 1,
  },
  listContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    zIndex: 2,
  },
  catCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
  },
  catAmountText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  catRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  percentageInputText: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 28,
    textAlign: 'center',
  },
  percentageSignText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 2,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  addCategoryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    paddingTop: Spacing.sm,
    zIndex: 2,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  pickerContainer: {
    width: '100%',
    maxHeight: 380,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickerList: {
    maxHeight: 280,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  noUnallocatedText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  createNewCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  createNewCategoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 1000,
  },
  noticeBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noticeCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    zIndex: 1001,
  },
  noticeIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  noticeMessage: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  noticeActions: {
    flexDirection: 'row',
    width: '100%',
  },
});
