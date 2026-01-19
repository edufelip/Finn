import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type ReportPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  postId: number;
};

const MIN_LENGTH = 15;
const MAX_LENGTH = 300;

export default function ReportPostModal({
  visible,
  onClose,
  onSubmit,
  postId,
}: ReportPostModalProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = reason.trim().length >= MIN_LENGTH;
  const charCount = reason.length;
  const charCountColor = charCount > MAX_LENGTH ? theme.error : theme.onSurfaceVariant;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (error) {
      // Keep modal open if submission fails
      // Error will be handled by parent component
      console.error('ReportPostModal submission error:', error);
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
              <Text style={styles.title}>Report Post</Text>
              <Pressable
                onPress={handleClose}
                disabled={submitting}
                testID="report-modal-close"
              >
                <MaterialIcons name="close" size={24} color={theme.onSurface} />
              </Pressable>
            </View>

            <Text style={styles.description}>
              Please tell us why you're reporting this post. Your report will help us keep the
              community safe.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Describe the issue (minimum 15 characters)"
                placeholderTextColor={theme.onSurfaceVariant}
                multiline
                maxLength={MAX_LENGTH}
                editable={!submitting}
                testID="report-modal-input"
              />
              <Text style={[styles.charCount, { color: charCountColor }]}>
                {charCount}/{MAX_LENGTH}
              </Text>
            </View>

            {reason.trim().length > 0 && reason.trim().length < MIN_LENGTH && (
              <Text style={styles.hint}>
                Please provide at least {MIN_LENGTH - reason.trim().length} more character
                {MIN_LENGTH - reason.trim().length === 1 ? '' : 's'}
              </Text>
            )}

            <Pressable
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || submitting}
              testID="report-modal-submit"
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
                    Submit Report
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
