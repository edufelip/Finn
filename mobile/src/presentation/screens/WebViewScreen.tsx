import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

import type { MainStackParamList } from '../navigation/MainStack';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { webViewCopy } from '../content/webViewCopy';

type WebViewRoute = RouteProp<MainStackParamList, 'WebView'>;

export default function WebViewScreen() {
  const navigation = useNavigation();
  const route = useRoute<WebViewRoute>();
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const title = route.params?.title ?? webViewCopy.titleFallback;
  const url = route.params?.url;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios-new" size={20} color={theme.onBackground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.content}>
        {url ? (
          <WebView
            source={{ uri: url }}
            startInLoadingState
            style={styles.webView}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.statusText}>{webViewCopy.loading}</Text>
              </View>
            )}
            renderError={() => (
              <View style={styles.loading}>
                <Text style={styles.statusText}>{webViewCopy.error}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.loading}>
            <Text style={styles.statusText}>{webViewCopy.error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 12,
      backgroundColor: theme.background,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonPressed: {
      backgroundColor: theme.surfaceVariant,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.onBackground,
      flex: 1,
    },
    content: {
      flex: 1,
      backgroundColor: theme.background,
    },
    webView: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.background,
    },
    statusText: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
    },
  });
