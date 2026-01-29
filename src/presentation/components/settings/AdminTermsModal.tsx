import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '../../../app/providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';

export type AdminTermsModalTestIds = {
  modal: string;
  input: string;
  cancel: string;
  confirm: string;
};

type AdminTermsModalProps = {
  visible: boolean;
  title: string;
  message: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  loading?: boolean;
  testIds: AdminTermsModalTestIds;
};

export function AdminTermsModal({
  visible,
  title,
  message,
  value,
  onChange,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  loading,
  testIds,
}: AdminTermsModalProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      testID={testIds.modal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalBody}>{message}</Text>
          <TextInput
            style={[styles.modalInput, styles.modalInputMultiline]}
            value={value}
            onChangeText={onChange}
            editable={!loading}
            multiline
            textAlignVertical="top"
            placeholder={message}
            placeholderTextColor={theme.onSurfaceVariant}
            testID={testIds.input}
            accessibilityLabel={testIds.input}
          />
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && styles.modalButtonPressed]}
              onPress={onCancel}
              disabled={loading}
              testID={testIds.cancel}
              accessibilityLabel={testIds.cancel}
            >
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalPrimary,
                loading && styles.modalConfirmDisabled,
                pressed && !loading && styles.modalButtonPressed,
              ]}
              onPress={onConfirm}
              disabled={loading}
              testID={testIds.confirm}
              accessibilityLabel={testIds.confirm}
            >
              <Text style={styles.modalPrimaryText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.onSurface,
      marginBottom: 8,
    },
    modalBody: {
      color: theme.onSurfaceVariant,
      fontSize: 13,
      marginBottom: 12,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.outline,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.onSurface,
      backgroundColor: theme.surfaceVariant,
    },
    modalInputMultiline: {
      minHeight: 96,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 12,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
      alignItems: 'center',
    },
    modalCancelText: {
      color: theme.onSurface,
      fontWeight: '600',
    },
    modalPrimary: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
    },
    modalConfirmDisabled: {
      backgroundColor: theme.outlineVariant,
    },
    modalPrimaryText: {
      color: theme.onPrimary,
      fontWeight: '600',
    },
    modalButtonPressed: {
      opacity: 0.8,
    },
  });
