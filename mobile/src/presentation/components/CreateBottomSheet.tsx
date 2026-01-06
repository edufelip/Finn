import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { createBottomSheetCopy } from '../content/createBottomSheetCopy';

type CreateBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreateCommunity: () => void;
  onCreatePost: () => void;
};

export default function CreateBottomSheet({
  visible,
  onClose,
  onCreateCommunity,
  onCreatePost,
}: CreateBottomSheetProps) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>{createBottomSheetCopy.title}</Text>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            onPress={onClose}
            accessibilityLabel={createBottomSheetCopy.closeLabel}
          >
            <MaterialIcons name="close" size={20} color={theme.onSurfaceVariant} />
          </Pressable>
        </View>
        <View style={styles.cardRow}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.communityCard,
              styles.cardLeft,
              pressed && styles.cardPressed,
            ]}
            onPress={onCreateCommunity}
            testID={createBottomSheetCopy.testIds.community}
            accessibilityLabel={createBottomSheetCopy.testIds.community}
          >
            <View style={[styles.iconCircle, styles.communityIcon]}>
              <MaterialIcons name="groups" size={26} color={theme.onPrimary} />
            </View>
            <Text style={styles.cardTitle}>{createBottomSheetCopy.communityLabel}</Text>
            <Text style={styles.cardBody}>{createBottomSheetCopy.communityDescription}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.postCard,
              styles.cardRight,
              pressed && styles.cardPressed,
            ]}
            onPress={onCreatePost}
            testID={createBottomSheetCopy.testIds.post}
            accessibilityLabel={createBottomSheetCopy.testIds.post}
          >
            <View style={[styles.iconCircle, styles.postIcon]}>
              <MaterialIcons name="edit-note" size={26} color={theme.onPrimary} />
            </View>
            <Text style={styles.cardTitle}>{createBottomSheetCopy.postLabel}</Text>
            <Text style={styles.cardBody}>{createBottomSheetCopy.postDescription}</Text>
          </Pressable>
        </View>
        <View style={styles.bottomSpacer} />
      </View>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
    },
    sheet: {
      backgroundColor: theme.surface,
      paddingTop: 12,
      paddingHorizontal: 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
      shadowColor: theme.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: -6 },
      shadowRadius: 16,
      elevation: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.onSurface,
    },
    handle: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.outline,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceVariant,
    },
    closePressed: {
      opacity: 0.8,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    card: {
      flex: 1,
      paddingVertical: 20,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
    },
    cardLeft: {
      marginRight: 12,
    },
    cardRight: {
      marginLeft: 12,
    },
    communityCard: {
      backgroundColor: theme.primaryContainer,
      borderColor: theme.primaryContainer,
    },
    postCard: {
      backgroundColor: theme.tertiaryContainer,
      borderColor: theme.tertiaryContainer,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOpacity: 0.7,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 6,
    },
    communityIcon: {
      backgroundColor: theme.primary,
    },
    postIcon: {
      backgroundColor: theme.tertiary,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.onSurface,
      marginBottom: 6,
    },
    cardBody: {
      fontSize: 11,
      color: theme.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 16,
    },
    cardPressed: {
      transform: [{ scale: 0.97 }],
      opacity: 0.95,
    },
    bottomSpacer: {
      height: 12,
    },
  });
