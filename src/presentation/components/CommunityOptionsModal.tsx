import React, { useMemo } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';

type CommunityOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onReport?: () => void;
  position: { x: number; y: number };
};

const CommunityOptionsModal = ({ visible, onClose, onReport, position }: CommunityOptionsModalProps) => {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const modalWidth = 180;
  const optionCount = 1;
  const modalHeight = optionCount * 44 + 8;
  const padding = 16;

  let left = position.x - modalWidth;
  let top = position.y;

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
              onReport?.();
              onClose();
            }}
            testID="community-option-report"
          >
            <MaterialIcons name="outlined-flag" size={20} color={theme.error} />
            <Text style={[styles.optionText, { color: theme.error }]}>Report</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default React.memo(CommunityOptionsModal);

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
