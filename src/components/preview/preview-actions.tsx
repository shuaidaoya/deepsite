import { FC, useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaCopy, FaDownload, FaList, FaEllipsisH } from 'react-icons/fa';
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
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 复制 HTML 到剪贴板
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success(t('preview.copySuccess'));
      setIsMenuExpanded(false);
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
      setIsMenuExpanded(false);
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
    setIsMenuExpanded(false);
  };

  // 打开模板列表对话框
  const handleOpenTemplatesList = () => {
    if (!isDBInitialized) {
      toast.error(t('indexedDB.notInitialized'));
      return;
    }
    setIsTemplatesListOpen(true);
    setIsMenuExpanded(false);
  };

  // 加载选择的模板
  const handleSelectTemplate = (templateHtml: string) => {
    if (onLoadTemplate) {
      onLoadTemplate(templateHtml);
    }
  };

  // 通用按钮样式类
  const buttonClass = "bg-gray-950 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* 主要按钮和展开按钮 */}
        <div className="flex items-center gap-2">
          {/* 保存模板按钮作为主要按钮始终显示 */}
          <button
            className="bg-green-700 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2 border border-green-800 hover:brightness-150 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleOpenSaveDialog}
            disabled={isDisabled}
            title={t('preview.saveToDBTooltip')}
          >
            <FaSave />
            <span className="hidden lg:inline">{t('preview.saveToDB')}</span>
          </button>
          
          {/* 更多按钮 */}
          <button
            className={`${buttonClass} ${isMenuExpanded ? 'bg-gray-700' : ''}`}
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            disabled={isDisabled}
            aria-expanded={isMenuExpanded}
            aria-label={t('preview.moreActions')}
            title={t('preview.moreActions')}
          >
            <FaEllipsisH />
          </button>
        </div>
        
        {/* 展开菜单 */}
        <div 
          className={`absolute right-0 bottom-full mb-2 bg-gray-900 rounded-lg shadow-lg overflow-hidden transition-all ${
            isMenuExpanded 
              ? 'opacity-100 max-h-[300px] transform scale-100 translate-y-0' 
              : 'opacity-0 max-h-0 transform scale-95 translate-y-2 pointer-events-none'
          }`}
          style={{ 
            width: '200px', 
            zIndex: 50,
            transitionDuration: '250ms',
            transitionTimingFunction: isMenuExpanded ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease-in-out'
          }}
        >
          {/* 复制按钮 */}
          <button
            className="w-full text-left px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleCopyHtml}
            disabled={isDisabled}
          >
            <FaCopy className="text-gray-400" />
            <span>{t('preview.copy')}</span>
          </button>
          
          {/* 下载按钮 */}
          <button
            className="w-full text-left px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleDownloadHtml}
            disabled={isDisabled}
          >
            <FaDownload className="text-gray-400" />
            <span>{t('preview.download')}</span>
          </button>
          
          {/* 模板列表按钮 */}
          <button
            className="w-full text-left px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleOpenTemplatesList}
            disabled={isDisabled}
          >
            <FaList className="text-gray-400" />
            <span>{t('preview.templatesList')}</span>
          </button>
        </div>
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