import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import Divider from '../components/Divider';
import { colors } from '../theme/colors';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
        <Divider />
      </View>
      <View style={styles.body}>
        <MaterialIcons name="settings" size={40} color={colors.darkGrey} />
        <Text style={styles.bodyText}>Coming soon…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    height: 60,
    justifyContent: 'flex-end',
    paddingLeft: 16,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  headerText: {
    fontSize: 16,
  },
  body: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bodyText: {
    fontSize: 16,
  },
});
