import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { imagePickerCopy } from '../content/imagePickerCopy';

type ImageSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
};

export default function ImageSourceSheet({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: ImageSourceSheetProps) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const translateY = useMemo(() => new Animated.Value(0), []);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [translateY, visible]);

  const animateClose = useCallback(() => {
    const target = sheetHeight > 0 ? sheetHeight : 320;
    Animated.timing(translateY, {
      toValue: target,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, sheetHeight, translateY]);

  const handleDismiss = () => {
    if (!visible) return;
    animateClose();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 6,
        onPanResponderMove: (_evt, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const shouldClose = gestureState.dy > sheetHeight * 0.25 || gestureState.vy > 1.2;
          if (shouldClose) {
            animateClose();
            return;
          }
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [animateClose, sheetHeight, translateY]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 20 },
          { transform: [{ translateY }] },
        ]}
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>{imagePickerCopy.title}</Text>
        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={onSelectCamera}
          testID={imagePickerCopy.testIds.camera}
          accessibilityLabel={imagePickerCopy.testIds.camera}
        >
          <View style={styles.optionIcon}>
            <MaterialIcons name="photo-camera" size={20} color={theme.onPrimary} />
          </View>
          <Text style={styles.optionText}>{imagePickerCopy.camera}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          onPress={onSelectGallery}
          testID={imagePickerCopy.testIds.gallery}
          accessibilityLabel={imagePickerCopy.testIds.gallery}
        >
          <View style={styles.optionIconSecondary}>
            <MaterialIcons name="photo-library" size={20} color={theme.onSurface} />
          </View>
          <Text style={styles.optionText}>{imagePickerCopy.gallery}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.optionPressed]}
          onPress={handleDismiss}
          testID={imagePickerCopy.testIds.cancel}
          accessibilityLabel={imagePickerCopy.testIds.cancel}
        >
          <Text style={styles.cancelText}>{imagePickerCopy.cancel}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    sheet: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: theme.outlineVariant,
      gap: 12,
    },
    handle: {
      alignSelf: 'center',
      width: 48,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.outline,
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.onSurface,
      marginBottom: 4,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.surfaceVariant,
    },
    optionPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIconSecondary: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurface,
    },
    cancelButton: {
      marginTop: 4,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: theme.surfaceVariant,
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
    },
  });
