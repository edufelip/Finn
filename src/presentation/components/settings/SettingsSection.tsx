import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '../../../app/providers/ThemeProvider';
import type { ThemeColors } from '../../theme/colors';

type SettingsSectionProps = {
  title: string;
  note?: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, note, children }: SettingsSectionProps) {
  const theme = useThemeColors();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    sectionLabel: {
      marginTop: 16,
      marginBottom: 8,
      marginHorizontal: 20,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.onSurfaceVariant,
      fontWeight: '600',
    },
    sectionNote: {
      marginTop: 8,
      marginHorizontal: 20,
      fontSize: 12,
      color: theme.onSurfaceVariant,
    },
  });
