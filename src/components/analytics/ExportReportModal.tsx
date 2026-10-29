import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Platform,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { X, Download, FileText, Check, Copy, Share2, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react-native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { generateTransactionsCSV, generateFinancialStatement, generateFinancialStatementHTML, generatePurePDFString } from '../../utils/exportHelpers';
import { DarkTheme, LightTheme, Spacing, BorderRadius, ShadowPresets } from '../../constants/theme';
import { getCurrentYearMonth } from '../../utils/dateHelpers';
import { Button } from '../common/Button';

const DOWNLOAD_DIR_KEY = '@expense_tracker_download_dir_uri';

interface ExportReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ visible, onClose }) => {
  const isDarkMode = useExpenseStore((state) => state.settings.isDarkMode);
  const transactions = useExpenseStore((state) => state.transactions);
  const categories = useExpenseStore((state) => state.categories);
  const accounts = useExpenseStore((state) => state.accounts);
  const budgets = useExpenseStore((state) => state.budgets);
  const settings = useExpenseStore((state) => state.settings);

  const theme = isDarkMode ? DarkTheme : LightTheme;
  const currentMonth = getCurrentYearMonth();

  const [exportFormat, setExportFormat] = useState<'csv' | 'statement'>('csv');
  const [copied, setCopied] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<{
    title: string;
    message: string;
    fileName?: string;
    isError?: boolean;
  } | null>(null);

  const createReportFile = async (): Promise<{ fileUri: string; fileName: string; reportText: string; isBinaryPdf?: boolean }> => {
    const isCsv = exportFormat === 'csv';

    if (isCsv) {
      const reportText = generateTransactionsCSV(transactions, categories, accounts, settings.currency, settings);
      const fileName = `Expense_Report_${currentMonth}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, reportText, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return { fileUri, fileName, reportText };
    }

    // PDF Executive Financial Statement Export
    const htmlContent = generateFinancialStatementHTML(transactions, categories, budgets, settings, currentMonth);
    const fileName = `Financial_Statement_${currentMonth}.pdf`;
    const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

    try {
      if (Platform.OS !== 'web') {
        const printResult = await Print.printToFileAsync({ html: htmlContent });
        if (printResult && printResult.uri) {
          try {
            await FileSystem.deleteAsync(targetUri, { idempotent: true });
          } catch (e) {}
          await FileSystem.copyAsync({ from: printResult.uri, to: targetUri });
          return { fileUri: targetUri, fileName, reportText: htmlContent, isBinaryPdf: true };
        }
      }
    } catch (printErr) {
      // Fallback to pure PDF string if printToFileAsync is unavailable
    }

    // Pure PDF 1.4 Binary Fallback
    const pdfContent = generatePurePDFString(transactions, categories, budgets, settings, currentMonth);
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch (e) {}

    await FileSystem.writeAsStringAsync(targetUri, pdfContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { fileUri: targetUri, fileName, reportText: pdfContent, isBinaryPdf: true };
  };

  const handleDownloadReport = async () => {
    try {
      const { fileUri, fileName, reportText, isBinaryPdf } = await createReportFile();
      const isCsv = exportFormat === 'csv';

      // 1. Web Browser Direct File Download
      if (Platform.OS === 'web') {
        const mimeType = isCsv ? 'text/csv;charset=utf-8;' : 'application/pdf;charset=utf-8;';
        const blob = new Blob([reportText], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadNotice({
          title: 'Download Complete',
          message: 'File saved directly to your Downloads folder!',
          fileName,
        });
        return;
      }

      // 2. Android Direct Storage Copy (Preserves Binary Integrity)
      if (Platform.OS === 'android') {
        const pathsToTry = [
          `file:///sdcard/Download/${fileName}`,
          `file:///storage/emulated/0/Download/${fileName}`,
        ];

        for (const targetPath of pathsToTry) {
          try {
            try {
              await FileSystem.deleteAsync(targetPath, { idempotent: true });
            } catch (delErr) {}

            await FileSystem.copyAsync({ from: fileUri, to: targetPath });
            setDownloadNotice({
              title: 'Download Complete',
              message: 'File saved directly to your Downloads folder!',
              fileName,
            });
            return;
          } catch (directErr) {
            // Try next path
          }
        }

        // SAF Fallback if direct sdcard write requires SAF permission
        try {
          let savedDirUri = await AsyncStorage.getItem(DOWNLOAD_DIR_KEY);
          if (!savedDirUri && FileSystem.StorageAccessFramework) {
            const downloadDirUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(downloadDirUri);
            if (permissions.granted) {
              savedDirUri = permissions.directoryUri;
              await AsyncStorage.setItem(DOWNLOAD_DIR_KEY, savedDirUri);
            }
          }

          if (savedDirUri && FileSystem.StorageAccessFramework) {
            const rawFileName = fileName.replace(/\.[^/.]+$/, '');
            const mimeType = isCsv ? 'text/csv' : 'application/pdf';
            const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
              savedDirUri,
              rawFileName,
              mimeType
            );

            if (isBinaryPdf) {
              const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              await FileSystem.writeAsStringAsync(createdUri, fileBase64, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } else {
              await FileSystem.writeAsStringAsync(createdUri, reportText, {
                encoding: FileSystem.EncodingType.UTF8,
              });
            }

            setDownloadNotice({
              title: 'Download Complete',
              message: 'File saved directly to your Downloads folder!',
              fileName,
            });
            return;
          }
        } catch (safErr) {
          await AsyncStorage.removeItem(DOWNLOAD_DIR_KEY);
        }
      }

      // 3. iOS / Mobile Share Fallback
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: isCsv ? 'text/csv' : 'application/pdf',
          dialogTitle: `Save ${fileName}`,
          UTI: isCsv ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
        });
      } else {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Share.share({ url: contentUri, title: fileName });
      }
    } catch (err) {
      setDownloadNotice({
        title: 'Export Error',
        message: 'Failed to save report file.',
        isError: true,
      });
    }
  };

  const handleShareReport = async () => {
    try {
      const { fileUri, fileName, reportText } = await createReportFile();
      const isCsv = exportFormat === 'csv';
      const mimeType = isCsv ? 'text/csv' : 'application/pdf';

      // 1. Web Share API with Files
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).canShare) {
        try {
          const blob = new Blob([reportText], { type: mimeType });
          const file = new File([blob], fileName, { type: mimeType });
          if ((navigator as any).canShare({ files: [file] })) {
            await (navigator as any).share({
              files: [file],
              title: fileName,
            });
            return;
          }
        } catch (webShareErr) {
          // Fall back to Sharing.shareAsync
        }
      }

      // 2. Native File Sharing (iOS & Android) via expo-sharing
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Share ${fileName}`,
          UTI: isCsv ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
        });
        return;
      }

      // 3. RN Share Fallback
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await Share.share({ url: contentUri, title: fileName });
    } catch (error) {
      setDownloadNotice({
        title: 'Share Error',
        message: 'Unable to open share menu.',
        isError: true,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={onClose} />

        {/* Frosted Sheet Container */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.95)',
              borderLeftColor: isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
              ...ShadowPresets.glass,
            },
          ]}
        >
          {/* Specular Inner Sheen Line */}
          <View style={styles.glassSheenLine} />

          {/* Background Ambient Glow Orbs */}
          <View
            style={[
              styles.ambientOrbTopRight,
              { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)' },
            ]}
          />

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Download size={18} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Export Financial Report</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.secondary }]}>
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Export Format Switcher */}
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Select Report Format</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                onPress={() => setExportFormat('csv')}
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: exportFormat === 'csv' ? theme.primaryDim : theme.secondary,
                    borderColor: exportFormat === 'csv' ? theme.primary : theme.border,
                  },
                ]}
              >
                <FileText size={20} color={exportFormat === 'csv' ? theme.primary : theme.textMuted} />
                <Text style={[styles.formatTitle, { color: exportFormat === 'csv' ? theme.primary : theme.text }]}>
                  CSV Spreadsheet (.csv)
                </Text>
                <Text style={[styles.formatSub, { color: theme.textMuted }]}>Excel & Google Sheets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setExportFormat('statement')}
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: exportFormat === 'statement' ? theme.primaryDim : theme.secondary,
                    borderColor: exportFormat === 'statement' ? theme.primary : theme.border,
                  },
                ]}
              >
                <FileText size={20} color={exportFormat === 'statement' ? theme.primary : theme.textMuted} />
                <Text style={[styles.formatTitle, { color: exportFormat === 'statement' ? theme.primary : theme.text }]}>
                  PDF Financial Statement
                </Text>
                <Text style={[styles.formatSub, { color: theme.textMuted }]}>Executive monthly summary</Text>
              </TouchableOpacity>
            </View>

            {/* Export Preview Summary */}
            <View style={[styles.previewBox, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Report Details</Text>
              <Text style={[styles.previewDetail, { color: theme.textMuted }]}>
                Period: {currentMonth} ({transactions.length} total transactions)
              </Text>
              <Text style={[styles.previewDetail, { color: theme.textMuted }]}>
                Format: {exportFormat === 'csv' ? 'CSV Raw Spreadsheet Data' : 'Structured PDF Executive Statement'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <Button
                title={`Download ${exportFormat.toUpperCase()} File`}
                onPress={handleDownloadReport}
                variant="primary"
                size="lg"
                icon={<Download size={18} color="#FFF" />}
                style={{ marginBottom: Spacing.sm }}
              />
              <Button
                title={`Share via Apps...`}
                onPress={handleShareReport}
                variant="secondary"
                size="lg"
                icon={<Share2 size={18} color={theme.text} />}
              />
            </View>
          </ScrollView>
        </View>

        {/* Modern Full-Screen Centered Custom Download Notice Modal */}
        <Modal
          visible={!!downloadNotice}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDownloadNotice(null)}
        >
          <View style={styles.fullScreenOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.fullScreenBackdrop}
              onPress={() => setDownloadNotice(null)}
            />
            <View
              style={[
                styles.noticeCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: downloadNotice?.isError ? '#EF4444' : theme.primary,
                  ...ShadowPresets.glass,
                },
              ]}
            >
              <View
                style={[
                  styles.noticeIconBadge,
                  {
                    backgroundColor: downloadNotice?.isError
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                    borderColor: downloadNotice?.isError ? '#EF4444' : '#10B981',
                  },
                ]}
              >
                {downloadNotice?.isError ? (
                  <AlertCircle size={32} color="#EF4444" />
                ) : (
                  <CheckCircle2 size={32} color="#10B981" />
                )}
              </View>

              <Text style={[styles.noticeTitle, { color: theme.text }]}>
                {downloadNotice?.title}
              </Text>

              {downloadNotice?.fileName && (
                <View
                  style={[
                    styles.fileNameBadge,
                    {
                      backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                      borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                    },
                  ]}
                >
                  <FileCheck size={14} color="#10B981" />
                  <Text style={[styles.fileNameText, { color: theme.primary }]}>
                    {downloadNotice.fileName}
                  </Text>
                </View>
              )}

              <Text style={[styles.noticeMessage, { color: theme.textMuted }]}>
                {downloadNotice?.message}
              </Text>

              <View style={styles.noticeActions}>
                <Button
                  title="Done"
                  onPress={() => setDownloadNotice(null)}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
                {!downloadNotice?.isError && downloadNotice?.fileName && (
                  <Button
                    title="Share File"
                    onPress={() => {
                      setDownloadNotice(null);
                      handleShareReport();
                    }}
                    variant="secondary"
                    size="md"
                    icon={<Share2 size={16} color={theme.text} />}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    width: '100%',
    height: '75%',
    maxHeight: '85%',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    paddingTop: Spacing.md,
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
  ambientOrbTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    pointerEvents: 'none',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  formatCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  formatTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  formatSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewDetail: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: Spacing.xs,
  },
  fullScreenOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  fullScreenBackdrop: {
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
    zIndex: 101,
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
  fileNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    marginVertical: Spacing.xs,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: '700',
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
    gap: Spacing.sm,
    width: '100%',
  },
});
