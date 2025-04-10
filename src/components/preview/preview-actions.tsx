import { FC, useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaSave, FaDownload, FaList, FaEllipsisH } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import SaveTemplateDialog from './save-template-dialog';
import TemplatesListDialog from './templates-list-dialog';
import { indexedDBService } from '../../utils/indexedDB';

// 导入更多语义化图标
import { FaCode } from 'react-icons/fa';
import { IoReturnUpBack } from "react-icons/io5";
import { MdAutorenew } from "react-icons/md";

interface PreviewActionsProps {
  html: string;
  isDisabled: boolean;
  onLoadTemplate?: (html: string) => void;
  // 添加自动刷新相关属性
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  isGenerating?: boolean; // 保留类型定义，但在实现中不使用
}

const PreviewActions: FC<PreviewActionsProps> = ({ 
  html, 
  isDisabled, 
  onLoadTemplate,
  autoRefresh = false,
  onToggleAutoRefresh
}) => {
  const { t } = useTranslation();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isTemplatesListOpen, setIsTemplatesListOpen] = useState(false);
  const [isDBInitialized, setIsDBInitialized] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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

  // 切换自动刷新状态
  const handleToggleAutoRefresh = () => {
    if (onToggleAutoRefresh) {
      onToggleAutoRefresh();
      setIsMenuExpanded(false);
    }
  };

  // 通用按钮样式类
  const buttonClass = "shadow-md text-white text-xs lg:text-sm font-medium py-2.5 px-3.5 lg:px-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-125 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* 主要按钮组 */}
        <div className="flex items-center gap-2">
          {/* 返回编辑器按钮 - 只在移动端显示 */}
          <button
            className={`${buttonClass} bg-gray-800 border border-gray-700 md:hidden`}
            onClick={() => window.history.back()} // 假设这是返回编辑器的操作
            title={t('preview.backToEditor')}
            aria-label={t('preview.backToEditor')}
          >
            <IoReturnUpBack className="text-base lg:text-lg" />
            <span className="hidden sm:inline whitespace-nowrap">{t('preview.backToEditor')}</span>
          </button>
          
          {/* 保存模板按钮 */}
          <button
            className={`${buttonClass} bg-green-700 border border-green-600`}
            onClick={handleOpenSaveDialog}
            disabled={isDisabled}
            title={t('preview.saveToDBTooltip')}
            aria-label={t('preview.saveToDB')}
          >
            <FaSave className="text-base lg:text-lg" />
            <span className="hidden lg:inline">{t('preview.saveToDB')}</span>
          </button>
          
          {/* 更多按钮 */}
          <button
            className={`${buttonClass} ${isMenuExpanded ? 'bg-gray-700' : 'bg-gray-800'} border border-gray-700`}
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            disabled={isDisabled}
            aria-expanded={isMenuExpanded}
            aria-label={t('preview.moreActions')}
            title={t('preview.moreActions')}
          >
            <FaEllipsisH className="text-base lg:text-lg" />
            <span className="hidden lg:inline">{t('preview.moreActions')}</span>
          </button>
        </div>
        
        {/* 展开菜单 */}
        <div 
          className={`absolute right-0 bottom-full mb-2 bg-gray-900 rounded-lg shadow-xl overflow-hidden transition-all ${
            isMenuExpanded 
              ? 'opacity-100 max-h-[300px] transform scale-100 translate-y-0' 
              : 'opacity-0 max-h-0 transform scale-95 translate-y-2 pointer-events-none'
          }`}
          style={{ 
            width: '220px', 
            zIndex: 50,
            transitionDuration: '250ms',
            transitionTimingFunction: isMenuExpanded ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease-in-out'
          }}
        >
          {/* 自动刷新切换按钮 */}
          <button
            className="w-full text-left px-4 py-3.5 flex items-center gap-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleToggleAutoRefresh}
            disabled={isDisabled}
            title={t('preview.autoRefresh')}
          >
            <div className="relative">
              <MdAutorenew className="text-lg text-gray-400" />
              <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-300' : 'bg-gray-400'}`}></div>
            </div>
            <span>{t('preview.autoRefresh')}</span>
            {autoRefresh && <span className="ml-auto text-xs text-green-400">●</span>}
          </button>
          
          {/* 复制源代码按钮 */}
          <button
            className="w-full text-left px-4 py-3.5 flex items-center gap-3 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            onClick={handleCopyHtml}
            disabled={isDisabled}
            title={t('preview.copy')}
          >
            <FaCode className="text-blue-400 text-lg" />
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