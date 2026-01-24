import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PostPermission } from '../../domain/models/community';
import { useThemeColors } from '../../app/providers/ThemeProvider';
import { useLocalization } from '../../app/providers/LocalizationProvider';
import type { ThemeColors } from '../theme/colors';
import { editCommunityCopy } from '../content/editCommunityCopy';

type PostPermissionSelectorProps = {
  selected: PostPermission;
  onSelect: (permission: PostPermission) => void;
};

type RadioOptionProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  description: string;
  testID: string;
  theme: ThemeColors;
};

const RadioOption = React.memo<RadioOptionProps>(
  ({ selected, onPress, label, description, testID, theme }) => {
    const styles = useMemo(() => createRadioStyles(theme), [theme]);

    return (
      <Pressable
        style={[styles.radioOption, selected && styles.radioOptionSelected]}
        onPress={onPress}
        testID={testID}
      >
        <View style={styles.radioContent}>
          <Text style={styles.radioLabel}>{label}</Text>
          <Text style={styles.radioDescription}>{description}</Text>
        </View>
        <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
          {selected && <View style={styles.radioCircleInner} />}
        </View>
      </Pressable>
    );
  }
);

RadioOption.displayName = 'RadioOption';

const PostPermissionSelector = ({ selected, onSelect }: PostPermissionSelectorProps) => {
  const theme = useThemeColors();
  useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{editCommunityCopy.postPermissionLabel}</Text>
      <View style={styles.radioGroup}>
        <RadioOption
          selected={selected === 'anyone_follows'}
          onPress={() => onSelect('anyone_follows')}
          label={editCommunityCopy.postPermissionOptions.anyone_follows.label}
          description={editCommunityCopy.postPermissionOptions.anyone_follows.description}
          testID={editCommunityCopy.testIds.postPermissionAnyoneFollows}
          theme={theme}
        />
        <RadioOption
          selected={selected === 'moderated'}
          onPress={() => onSelect('moderated')}
          label={editCommunityCopy.postPermissionOptions.moderated.label}
          description={editCommunityCopy.postPermissionOptions.moderated.description}
          testID={editCommunityCopy.testIds.postPermissionModerated}
          theme={theme}
        />
        <RadioOption
          selected={selected === 'private'}
          onPress={() => onSelect('private')}
          label={editCommunityCopy.postPermissionOptions.private.label}
          description={editCommunityCopy.postPermissionOptions.private.description}
          testID={editCommunityCopy.testIds.postPermissionPrivate}
          theme={theme}
        />
      </View>
    </View>
  );
};

export default React.memo(PostPermissionSelector);

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.onSurfaceVariant,
      marginBottom: 12,
      marginHorizontal: 16,
    },
    radioGroup: {
      marginHorizontal: 16,
      gap: 12,
    },
  });

const createRadioStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    radioOptionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryContainer,
    },
    radioContent: {
      flex: 1,
      marginRight: 12,
    },
    radioLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.onSurface,
      marginBottom: 4,
    },
    radioDescription: {
      fontSize: 13,
      color: theme.onSurfaceVariant,
      lineHeight: 18,
    },
    radioCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: theme.primary,
    },
    radioCircleInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.primary,
    },
  });
