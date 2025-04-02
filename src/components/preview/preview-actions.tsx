import { FC, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaCopy, FaDownload, FaList } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import SaveTemplateDialog from './save-template-dialog';
import TemplatesListDialog from './templates-list-dialog';
import { indexedDBService } from '../../utils/indexedDB';

interface PreviewActionsProps {
  html: string;
  isDisabled: boolean;
  onLoadTemplate?: (html: string) => void;
}

const PreviewActions: FC<PreviewActionsProps> = ({ html, isDisabled, onLoadTemplate }) => {
  const { t } = useTranslation();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isTemplatesListOpen, setIsTemplatesListOpen] = useState(false);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  // 初始化 IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await indexedDBService.initDB();
        setIsDBInitialized(true);
      } catch (error) {
        console.error('初始化 IndexedDB 失败:', error);
      }
    };
    
    initDB();
  }, []);

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

  // 打开保存模板对话框
  const handleOpenSaveDialog = () => {
    if (!isDBInitialized) {
      toast.error(t('indexedDB.notInitialized'));
      return;
    }
    setIsSaveDialogOpen(true);
  };

  // 打开模板列表对话框
  const handleOpenTemplatesList = () => {
    if (!isDBInitialized) {
      toast.error(t('indexedDB.notInitialized'));
      return;
    }
    setIsTemplatesListOpen(true);
  };

  // 加载选择的模板
  const handleSelectTemplate = (templateHtml: string) => {
    if (onLoadTemplate) {
      onLoadTemplate(templateHtml);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
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
        <button
          className="bg-green-700 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-green-800 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleOpenSaveDialog}
          disabled={isDisabled}
          title={t('preview.saveToDBTooltip')}
        >
          <FaSave />
          <span className="hidden lg:inline">{t('preview.saveToDB')}</span>
        </button>
        <button
          className="bg-purple-700 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-purple-800 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleOpenTemplatesList}
          disabled={isDisabled}
          title={t('preview.templatesListTooltip')}
        >
          <FaList />
          <span className="hidden lg:inline">{t('preview.templatesList')}</span>
        </button>
      </div>
      
      {/* 保存模板对话框 */}
      <SaveTemplateDialog 
        html={html} 
        isOpen={isSaveDialogOpen} 
        onClose={() => setIsSaveDialogOpen(false)} 
      />
      
      {/* 模板列表对话框 */}
      <TemplatesListDialog 
        isOpen={isTemplatesListOpen} 
        onClose={() => setIsTemplatesListOpen(false)} 
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
};

export default PreviewActions; 