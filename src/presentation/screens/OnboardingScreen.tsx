import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../../app/providers/ThemeProvider';
import { useAppStore } from '../../app/store/appStore';
import { spacing, radii } from '../theme/metrics';
import { onboardingCopy } from '../content/onboardingCopy';
import { Images } from '@assets/images';

import { useLocalization } from '../../app/providers/LocalizationProvider';

export default function OnboardingScreen() {
  const { locale } = useLocalization();
  const theme = useThemeColors();
  const { completeOnboarding } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isTablet = Math.min(screenWidth, screenHeight) >= 768;
  const imageMaxWidth = screenWidth - spacing.xl * 2;
  const imageMaxHeight = Math.floor(screenHeight * (isLandscape ? 0.38 : 0.45));
  const imageSize = isTablet ? Math.min(imageMaxWidth, imageMaxHeight) : imageMaxWidth;
  const slides = useMemo(
    () => [
      {
        id: '1',
        title: onboardingCopy.slides.discover.title,
        description: onboardingCopy.slides.discover.description,
        image: Images.onboardingFirst,
      },
      {
        id: '2',
        title: onboardingCopy.slides.share.title,
        description: onboardingCopy.slides.share.description,
        image: Images.onboardingSecond,
      },
      {
        id: '3',
        title: onboardingCopy.slides.connect.title,
        description: onboardingCopy.slides.connect.description,
        image: Images.onboardingThird,
      },
    ],
    [locale]
  );

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * screenWidth,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex - 1) * screenWidth,
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(newIndex);
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]}
      testID={onboardingCopy.testIds.container}
    >
      <View style={styles.header}>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity 
            onPress={handleSkip} 
            style={styles.skipButton}
            testID={onboardingCopy.testIds.skipButton}
          >
            <Text style={[styles.skipText, { color: theme.onSurfaceVariant }]}>
              {onboardingCopy.skip}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        testID={onboardingCopy.testIds.scrollView}
      >
        {slides.map((slide, index) => (
          <View 
            key={slide.id} 
            style={[styles.slide, { width: screenWidth }]}
            testID={onboardingCopy.testIds.slide(index)}
          >
            <View style={styles.imageContainer}>
              <View
                style={[
                  styles.imageWrapper,
                  {
                    backgroundColor: theme.surfaceVariant,
                    width: imageSize,
                    height: imageSize,
                  },
                ]}
              >
                <Image
                  source={slide.image}
                  style={styles.image}
                  resizeMode="cover"
                  testID={onboardingCopy.testIds.slideImage(index)}
                />
                <LinearGradient
                  colors={['transparent', theme.background]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.5, y: 0.5 }}
                  end={{ x: 0.5, y: 1 }}
                />
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[styles.title, { color: theme.onBackground }]}
                testID={onboardingCopy.testIds.slideTitle(index)}
              >
                {slide.title}
              </Text>
              <Text 
                style={[styles.description, { color: theme.onSurfaceVariant }]}
                testID={onboardingCopy.testIds.slideDescription(index)}
              >
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? theme.primary
                      : theme.outline,
                  width: index === currentIndex ? 32 : 8,
                },
              ]}
              testID={onboardingCopy.testIds.dot(index)}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex === 0 ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleNext}
              testID={onboardingCopy.testIds.nextButton}
            >
              <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                {onboardingCopy.buttons.next}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={theme.onPrimary} style={styles.icon} />
            </TouchableOpacity>
          ) : currentIndex === 1 ? (
            <View style={styles.rowButtons}>
               <TouchableOpacity
                style={[styles.buttonHalf, { backgroundColor: theme.surfaceVariant }]}
                onPress={handlePrev}
                testID={onboardingCopy.testIds.previousButton}
              >
                <Text style={[styles.buttonText, { color: theme.onSurface }]}>
                  {onboardingCopy.buttons.previous}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonHalf, { backgroundColor: theme.primary }]}
                onPress={handleNext}
                testID={onboardingCopy.testIds.nextButton}
              >
                <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                  {onboardingCopy.buttons.next}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.colButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleNext}
                testID={onboardingCopy.testIds.getStartedButton}
              >
                <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                  {onboardingCopy.buttons.getStarted}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={theme.onPrimary} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.textButton]}
                onPress={handlePrev}
                testID={onboardingCopy.testIds.previousButton}
              >
                <Text style={[styles.textButtonText, { color: theme.onSurfaceVariant }]}>
                  {onboardingCopy.buttons.previous}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    height: 60,
    zIndex: 10,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  imageContainer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  imageWrapper: {
    borderRadius: radii.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 0 : spacing.xl,
    marginBottom: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: radii.pill,
  },
  buttonContainer: {
    width: '100%',
    minHeight: 120, // Reserve space to avoid jumping
    justifyContent: 'flex-start',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonHalf: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  colButtons: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  textButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
