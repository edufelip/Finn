import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{createBottomSheetCopy.title}</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.action, styles.communityAction]}
            onPress={onCreateCommunity}
            testID={createBottomSheetCopy.testIds.community}
            accessibilityLabel={createBottomSheetCopy.testIds.community}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="home" size={24} color={colors.white} />
            </View>
            <Text style={styles.label}>{createBottomSheetCopy.communityLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.action, styles.postAction]}
            onPress={onCreatePost}
            testID={createBottomSheetCopy.testIds.post}
            accessibilityLabel={createBottomSheetCopy.testIds.post}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="library-books" size={24} color={colors.white} />
            </View>
            <Text style={styles.label}>{createBottomSheetCopy.postLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  sheet: {
    backgroundColor: colors.mainBlue,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  action: {
    alignItems: 'center',
    gap: 6,
  },
  communityAction: {
    width: 90,
    marginEnd: 16,
  },
  postAction: {
    width: 80,
    marginStart: 16,
  },
  iconCircle: {
    padding: 8,
  },
  label: {
    color: colors.white,
  },
});
