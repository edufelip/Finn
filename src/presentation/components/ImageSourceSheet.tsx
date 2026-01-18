import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const { height: screenHeight } = Dimensions.get('window');
  
  // Start off-screen by default
  const translateY = useMemo(() => new Animated.Value(screenHeight), [screenHeight]);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      // Reset to off-screen to prevent flash
      translateY.setValue(screenHeight);
      
      // Animate in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12,
      }).start();
    }
  }, [visible, screenHeight, translateY]);

  const animateClose = useCallback(() => {
    const target = sheetHeight > 0 ? sheetHeight : screenHeight;
    Animated.timing(translateY, {
      toValue: target,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, sheetHeight, screenHeight, translateY]);

  const handleDismiss = () => {
    if (!visible) return;
    animateClose();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 5,
        onPanResponderMove: (_evt, gestureState) => {
           // Only allow dragging down
           if (gestureState.dy > 0) {
             translateY.setValue(gestureState.dy);
           }
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const dragDistance = gestureState.dy;
          const dragVelocity = gestureState.vy;
          const closeThreshold = (sheetHeight || 200) * 0.25;
          
          if (dragDistance > closeThreshold || dragVelocity > 0.5) {
            animateClose();
          } else {
            // Spring back to open
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        },
      }),
    [animateClose, sheetHeight, translateY]
  );

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
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