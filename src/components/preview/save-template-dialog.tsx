import { FC, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { indexedDBService } from '../../utils/indexedDB';

interface SaveTemplateDialogProps {
  html: string;
  isOpen: boolean;
  onClose: () => void;
}

const SaveTemplateDialog: FC<SaveTemplateDialogProps> = ({ html, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setIsSaving(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 处理保存
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('saveTemplate.titleRequired'));
      return;
    }

    try {
      setIsSaving(true);
      await indexedDBService.saveTemplate({
        title: title.trim(),
        html,
        createdAt: new Date()
      });
      toast.success(t('saveTemplate.saveSuccess'));
      handleClose();
    } catch (error) {
      console.error('保存模板失败:', error);
      toast.error(t('saveTemplate.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-4">{t('saveTemplate.title')}</h2>
        
        <div className="mb-4">
          <label htmlFor="template-title" className="block text-sm font-medium text-gray-300 mb-2">
            {t('saveTemplate.templateName')}
          </label>
          <input
            id="template-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('saveTemplate.templateNamePlaceholder')}
            disabled={isSaving}
          />
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors duration-200 flex items-center justify-center min-w-[80px]"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateDialog; 