import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useThemeColors } from '../../../app/providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';

export type DeleteAccountModalTestIds = {
  modal: string;
  input: string;
  cancel: string;
  confirm: string;
};

type DeleteAccountModalProps = {
  visible: boolean;
  title: string;
  body: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showMismatch: boolean;
  mismatchText: string;
  confirmDisabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  testIds: DeleteAccountModalTestIds;
};

export function DeleteAccountModal({
  visible,
  title,
  body,
  hint,
  placeholder,
  value,
  onChange,
  showMismatch,
  mismatchText,
  confirmDisabled,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
  testIds,
}: DeleteAccountModalProps) {
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
          <Text style={styles.modalBody}>{body}</Text>
          <Text style={styles.modalHint}>{hint}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor={theme.onSurfaceVariant}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            keyboardType="email-address"
            testID={testIds.input}
            accessibilityLabel={testIds.input}
          />
          {showMismatch ? (
            <Text style={styles.modalError}>{mismatchText}</Text>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.modalCancel, pressed && styles.modalButtonPressed]}
              onPress={onCancel}
              testID={testIds.cancel}
              accessibilityLabel={testIds.cancel}
            >
              <Text style={styles.modalCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalConfirm,
                confirmDisabled && styles.modalConfirmDisabled,
                pressed && !confirmDisabled && styles.modalButtonPressed,
              ]}
              onPress={onConfirm}
              disabled={confirmDisabled}
              testID={testIds.confirm}
              accessibilityLabel={testIds.confirm}
            >
              <Text style={styles.modalConfirmText}>{confirmLabel}</Text>
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
    modalHint: {
      color: theme.onSurface,
      fontSize: 12,
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
    modalError: {
      color: theme.error,
      fontSize: 12,
      marginTop: 8,
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
    modalConfirm: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.error,
      alignItems: 'center',
    },
    modalConfirmDisabled: {
      backgroundColor: theme.outlineVariant,
    },
    modalConfirmText: {
      color: theme.onError,
      fontWeight: '600',
    },
    modalButtonPressed: {
      opacity: 0.8,
    },
  });
