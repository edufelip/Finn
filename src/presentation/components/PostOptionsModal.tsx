import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import { useLocalization } from '../../app/providers/LocalizationProvider';
import type { ThemeColors } from '../theme/colors';
import { postCardCopy } from '../content/postCardCopy';

type PostOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  onReport?: () => void;
  onBlockUser?: () => void;
  onMarkForReview?: () => void;
  isSaved: boolean;
  canModerate?: boolean;
  canBlockUser?: boolean;
  position: { x: number; y: number };
};

const PostOptionsModal = ({
  visible,
  onClose,
  onSave,
  onReport,
  onBlockUser,
  onMarkForReview,
  isSaved,
  canModerate = false,
  canBlockUser = false,
  position,
}: PostOptionsModalProps) => {
  const theme = useThemeColors();
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Calculate position to ensure modal stays on screen
  const modalWidth = 180;
  const optionCount = 1 + 1 + (canModerate ? 1 : 0) + (canBlockUser ? 1 : 0);
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
            <Text style={styles.optionText}>{isSaved ? postCardCopy.unsave : postCardCopy.save}</Text>
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
              <Text style={[styles.optionText, { color: theme.tertiary }]}>{postCardCopy.markForReview}</Text>
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
            <Text style={[styles.optionText, { color: theme.error }]}>{postCardCopy.reportAction}</Text>
          </Pressable>
          {canBlockUser && onBlockUser && (
            <Pressable
              style={styles.option}
              onPress={() => {
                onBlockUser();
                onClose();
              }}
              testID="post-option-block-user"
            >
              <MaterialIcons name="block" size={20} color={theme.error} />
              <Text style={[styles.optionText, { color: theme.error }]}>{postCardCopy.blockAction}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default React.memo(PostOptionsModal);

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
