import React from 'react';
import { t } from '../i18n';
import ReportReasonModal from './ReportReasonModal';

type ReportCommunityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  communityId: number;
};

export default function ReportCommunityModal({
  visible,
  onClose,
  onSubmit,
  communityId: _communityId,
}: ReportCommunityModalProps) {
  return (
    <ReportReasonModal
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      title={t('community.report.modal.title')}
      description={t('community.report.modal.description')}
      placeholder={t('community.report.modal.placeholder')}
      submitLabel={t('community.report.modal.submit')}
      hint={(remaining) =>
        t('community.report.modal.hint', {
          count: String(remaining),
          plural: remaining === 1 ? '' : 's',
        })
      }
      testIds={{
        close: 'community-report-modal-close',
        input: 'community-report-modal-input',
        submit: 'community-report-modal-submit',
      }}
    />
  );
}
