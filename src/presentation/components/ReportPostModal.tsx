import { t } from '../i18n';
import ReportReasonModal from './ReportReasonModal';

type ReportPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  postId: number;
};

export default function ReportPostModal({
  visible,
  onClose,
  onSubmit,
  postId: _postId,
}: ReportPostModalProps) {
  return (
    <ReportReasonModal
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      title={t('post.report.modal.title')}
      description={t('post.report.modal.description')}
      placeholder={t('post.report.modal.placeholder')}
      submitLabel={t('post.report.modal.submit')}
      hint={(remaining) =>
        t('post.report.modal.hint', {
          count: String(remaining),
          plural: remaining === 1 ? '' : 's',
        })
      }
      testIds={{
        close: 'report-modal-close',
        input: 'report-modal-input',
        submit: 'report-modal-submit',
      }}
    />
  );
}
