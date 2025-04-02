import { FC } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaCopy, FaDownload } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface PreviewActionsProps {
  html: string;
  isDisabled: boolean;
}

const PreviewActions: FC<PreviewActionsProps> = ({ html, isDisabled }) => {
  const { t } = useTranslation();

  // 复制 HTML 到剪贴板
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success(t('preview.copySuccess'));
    } catch (error) {
      console.error('复制 HTML 失败:', error);
      toast.error(t('preview.copyFailed'));
    }
  };

  // 下载 HTML 文件
  const handleDownloadHtml = () => {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deepsite-page.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('preview.downloadSuccess'));
    } catch (error) {
      console.error('下载 HTML 失败:', error);
      toast.error(t('preview.downloadFailed'));
    }
  };

  // 自动保存到浏览器本地存储
  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem('html_content', html);
      toast.success(t('preview.saveSuccess'));
    } catch (error) {
      console.error('保存 HTML 失败:', error);
      toast.error(t('preview.saveFailed'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="bg-gray-950 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSaveToLocalStorage}
        disabled={isDisabled}
        title={t('preview.saveTooltip')}
      >
        <FaSave />
        <span className="hidden lg:inline">{t('preview.save')}</span>
      </button>
      <button
        className="bg-gray-950 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleCopyHtml}
        disabled={isDisabled}
        title={t('preview.copyTooltip')}
      >
        <FaCopy />
        <span className="hidden lg:inline">{t('preview.copy')}</span>
      </button>
      <button
        className="bg-gray-950 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDownloadHtml}
        disabled={isDisabled}
        title={t('preview.downloadTooltip')}
      >
        <FaDownload />
        <span className="hidden lg:inline">{t('preview.download')}</span>
      </button>
    </div>
  );
};

export default PreviewActions; 