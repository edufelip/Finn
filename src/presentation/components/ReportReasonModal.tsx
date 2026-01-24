import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type ReportReasonModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  hint: (remaining: number) => string;
  testIds: {
    close: string;
    input: string;
    submit: string;
  };
  minLength?: number;
  maxLength?: number;
};

const DEFAULT_MIN_LENGTH = 15;
const DEFAULT_MAX_LENGTH = 300;

export default function ReportReasonModal({
  visible,
  onClose,
  onSubmit,
  title,
  description,
  placeholder,
  submitLabel,
  hint,
  testIds,
  minLength = DEFAULT_MIN_LENGTH,
  maxLength = DEFAULT_MAX_LENGTH,
}: ReportReasonModalProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmedLength = reason.trim().length;
  const isValid = trimmedLength >= minLength;
  const charCount = reason.length;
  const charCountColor = charCount > maxLength ? theme.error : theme.onSurfaceVariant;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (error) {
      console.error('ReportReasonModal submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={handleClose} disabled={submitting} testID={testIds.close}>
                <MaterialIcons name="close" size={24} color={theme.onSurface} />
              </Pressable>
            </View>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder={placeholder}
                placeholderTextColor={theme.onSurfaceVariant}
                multiline
                maxLength={maxLength}
                editable={!submitting}
                testID={testIds.input}
              />
              <Text style={[styles.charCount, { color: charCountColor }]}>
                {charCount}/{maxLength}
              </Text>
            </View>

            {trimmedLength > 0 && trimmedLength < minLength && (
              <Text style={styles.hint}>{hint(minLength - trimmedLength)}</Text>
            )}

            <Pressable
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || submitting}
              testID={testIds.submit}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <>
                  <MaterialIcons
                    name="flag"
                    size={20}
                    color={isValid ? theme.onPrimary : theme.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.submitButtonText,
                      !isValid && styles.submitButtonTextDisabled,
                    ]}
                  >
                    {submitLabel}
                  </Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 400,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.onSurface,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.onSurfaceVariant,
      marginBottom: 20,
    },
    inputContainer: {
      position: 'relative',
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: theme.onSurface,
      minHeight: 120,
      maxHeight: 200,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: theme.outline,
    },
    charCount: {
      position: 'absolute',
      bottom: 8,
      right: 12,
      fontSize: 12,
      fontWeight: '500',
    },
    hint: {
      fontSize: 12,
      color: theme.onSurfaceVariant,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    submitButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    submitButtonDisabled: {
      backgroundColor: theme.surfaceVariant,
    },
    submitButtonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    submitButtonTextDisabled: {
      color: theme.onSurfaceVariant,
    },
  });
