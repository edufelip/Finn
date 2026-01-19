import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
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

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: onboardingCopy.slides.discover.title,
    description: onboardingCopy.slides.discover.description,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA9uRVrs97YBnNDISgfmigG7AqDoXD6p6eiNeSe0NRJ6_9gsDle-vLuepXjbV3LPqOKGE7Ks2SMdBawxh3XD56ltkcM4YCKARw4_Jtidmn2VJei4cQlkqJpGIPV841XihGoeDk6INwV7pp7c47hE97f6Mb2dXrlspmPeUl8FecRtCDwPvY_ldXuwIZOoOyNnn-a57kzqF7mKlgp6WWpUFwsiixtTjFJn2BOhLGd_Sq7NRS4j0Endajay87rxdciUG028AcPBjSzLLM_',
  },
  {
    id: '2',
    title: onboardingCopy.slides.share.title,
    description: onboardingCopy.slides.share.description,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDuBvDAC-c3zc3Cuy9i6OwXe3jZhyC7SZ-NetYXqviLRt5wJCudv-nU-WBnjFUCHBk0wBHpoTqE5CiEnF3NX8IkWVM1C-SmYt_2xczv2TvqbCWiqLcgIwMUUDQ5wFr8_9jyj6KJzhRUDP5hKbYAHEtsuSRjWiJFCDZ87xMgzPXOGXH0t-Lea2nn8Ho_8bZQE5vW3Ch1DEEq7gWY8SzQAHQFUFsnQgedR4GRvh6iLEFOUSS4gUH5pf-lXrLDDONywba3itASp-iJY6Dp',
  },
  {
    id: '3',
    title: onboardingCopy.slides.connect.title,
    description: onboardingCopy.slides.connect.description,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBeJ43E6DZc1U2Owj5OMaXdM9UhXeADzTI-dEgJ_YQpxQ5K8snPJoVOjmLkjVYPJvlE1Zai-t1ocpoqLXtE0ytnAboNdEY1WuUJnoa4IS9zzCn6gMNm5P5wfiSPBMN1ZEUR2Qpc83GYOyPh24_FXqiGKvFR2LvMS6M6t3eLOH9i1_sn8S_nnkcbyPsF02t6U-Gys1zFXZjJplG1wIjkeINXazCBQ3JzHWMMbNClJMo1cr_sEDeWNCOA9cMI_gibZZaeMdwWASp6Psz3',
  },
];

export default function OnboardingScreen() {
  const theme = useThemeColors();
  const { completeOnboarding } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * width,
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
        x: (currentIndex - 1) * width,
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
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.background }]}
      testID={onboardingCopy.testIds.container}
    >
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 && (
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
        {SLIDES.map((slide, index) => (
          <View 
            key={slide.id} 
            style={[styles.slide, { width }]}
            testID={onboardingCopy.testIds.slide(index)}
          >
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: theme.surfaceVariant }]}>
                <Image
                  source={{ uri: slide.image }}
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
          {SLIDES.map((_, index) => (
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
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
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
