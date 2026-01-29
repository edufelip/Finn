import React from 'react';

import { settingsCopy } from '../../content/settingsCopy';
import { SettingsCard } from './SettingsCard';
import { SettingsRow } from './SettingsRow';
import { SettingsSection } from './SettingsSection';

type AdminToolsSectionProps = {
  canManageUsers: boolean;
  isAdmin: boolean;
  onBanUser: () => void;
  onUnbanUser: () => void;
  onSetRole: () => void;
  onEditBlockedTerms: () => void;
  onEditReviewTerms: () => void;
};

export function AdminToolsSection({
  canManageUsers,
  isAdmin,
  onBanUser,
  onUnbanUser,
  onSetRole,
  onEditBlockedTerms,
  onEditReviewTerms,
}: AdminToolsSectionProps) {
  if (!canManageUsers) {
    return null;
  }

  return (
    <>
      <SettingsSection title={settingsCopy.sections.admin} note={settingsCopy.sections.adminNote}>
        <SettingsCard>
          <SettingsRow
            label={settingsCopy.options.adminBanUser}
            iconName="block"
            tone="danger"
            onPress={onBanUser}
            chevron
            testID={settingsCopy.testIds.adminBanUser}
            accessibilityLabel={settingsCopy.testIds.adminBanUser}
          />
          <SettingsRow
            label={settingsCopy.options.adminUnbanUser}
            iconName="lock-open"
            onPress={onUnbanUser}
            divider
            chevron
            testID={settingsCopy.testIds.adminUnbanUser}
            accessibilityLabel={settingsCopy.testIds.adminUnbanUser}
          />
          {isAdmin ? (
            <>
              <SettingsRow
                label={settingsCopy.options.adminSetRole}
                iconName="admin-panel-settings"
                onPress={onSetRole}
                divider
                chevron
                testID={settingsCopy.testIds.adminSetRole}
                accessibilityLabel={settingsCopy.testIds.adminSetRole}
              />
              <SettingsRow
                label={settingsCopy.options.adminBlockedTerms}
                iconName="report"
                onPress={onEditBlockedTerms}
                divider
                chevron
                testID={settingsCopy.testIds.adminBlockedTerms}
                accessibilityLabel={settingsCopy.testIds.adminBlockedTerms}
              />
              <SettingsRow
                label={settingsCopy.options.adminReviewTerms}
                iconName="visibility"
                onPress={onEditReviewTerms}
                chevron
                testID={settingsCopy.testIds.adminReviewTerms}
                accessibilityLabel={settingsCopy.testIds.adminReviewTerms}
              />
            </>
          ) : null}
        </SettingsCard>
      </SettingsSection>
    </>
  );
}
