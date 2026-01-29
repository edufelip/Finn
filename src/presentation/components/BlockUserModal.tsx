import { t } from '../i18n';
import ReportReasonModal from './ReportReasonModal';

type BlockUserModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  userName?: string | null;
};

export default function BlockUserModal({
  visible,
  onClose,
  onSubmit,
  userName,
}: BlockUserModalProps) {
  return (
    <ReportReasonModal
      visible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      title={t('post.block.modal.title')}
      description={t('post.block.modal.description', { userName: userName ?? '' })}
      placeholder={t('post.block.modal.placeholder')}
      submitLabel={t('post.block.modal.submit')}
      hint={(remaining) =>
        t('post.block.modal.hint', {
          count: String(remaining),
          plural: remaining === 1 ? '' : 's',
        })
      }
      testIds={{
        close: 'block-modal-close',
        input: 'block-modal-input',
        submit: 'block-modal-submit',
      }}
    />
  );
}
