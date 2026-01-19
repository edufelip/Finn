import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type PostOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  onReport?: () => void;
  onMarkForReview?: () => void;
  isSaved: boolean;
  canModerate?: boolean;
  position: { x: number; y: number };
};

export default function PostOptionsModal({
  visible,
  onClose,
  onSave,
  onReport,
  onMarkForReview,
  isSaved,
  canModerate = false,
  position,
}: PostOptionsModalProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Calculate position to ensure modal stays on screen
  const modalWidth = 180;
  const optionCount = canModerate ? 3 : 2;
  const modalHeight = optionCount * 44 + 8; // ~44px per option + padding
  const padding = 16;

  let left = position.x - modalWidth; // Align right edge with button
  let top = position.y; // Position at button level

  // Keep modal within screen bounds
  if (left < padding) left = padding;
  if (left + modalWidth > screenWidth - padding) left = screenWidth - modalWidth - padding;
  if (top + modalHeight > screenHeight - padding) top = position.y - modalHeight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modal,
            {
              position: 'absolute',
              left,
              top,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Pressable
            style={styles.option}
            onPress={() => {
              onSave?.();
              onClose();
            }}
            testID="post-option-save"
          >
            <MaterialIcons
              name={isSaved ? 'bookmark' : 'bookmark-border'}
              size={20}
              color={theme.onSurface}
            />
            <Text style={styles.optionText}>{isSaved ? 'Unsave' : 'Save'}</Text>
          </Pressable>
          {canModerate && onMarkForReview && (
            <Pressable
              style={styles.option}
              onPress={() => {
                onMarkForReview();
                onClose();
              }}
              testID="post-option-mark-review"
            >
              <MaterialIcons name="flag" size={20} color={theme.tertiary} />
              <Text style={[styles.optionText, { color: theme.tertiary }]}>Mark for Review</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.option}
            onPress={() => {
              onReport?.();
              onClose();
            }}
            testID="post-option-report"
          >
            <MaterialIcons name="outlined-flag" size={20} color={theme.error} />
            <Text style={[styles.optionText, { color: theme.error }]}>Report</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modal: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingVertical: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.outline,
      minWidth: 160,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    optionText: {
      fontSize: 15,
      color: theme.onSurface,
      fontWeight: '500',
    },
  });
