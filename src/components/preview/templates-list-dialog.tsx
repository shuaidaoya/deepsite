import { FC, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { indexedDBService, SavedTemplate } from '../../utils/indexedDB';
import { FaTrash, FaEye, FaCopy, FaDownload } from 'react-icons/fa';

interface TemplatesListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (html: string) => void;
}

const TemplatesListDialog: FC<TemplatesListDialogProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copyId, setCopyId] = useState<number | null>(null);
  const [downloadId, setDownloadId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 加载模板列表
  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await indexedDBService.getAllTemplates();
      // 按创建时间倒序排列
      templates.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTemplates(templates);
    } catch (error) {
      console.error('加载模板列表失败:', error);
      toast.error(t('templatesList.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 删除模板
  const handleDeleteTemplate = async (id: number) => {
    try {
      setDeleteId(id);
      await indexedDBService.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      toast.success(t('templatesList.deleteSuccess'));
    } catch (error) {
      console.error('删除模板失败:', error);
      toast.error(t('templatesList.deleteError'));
    } finally {
      setDeleteId(null);
    }
  };

  // 选择模板
  const handleSelectTemplate = (template: SavedTemplate) => {
    onSelectTemplate(template.html);
    handleClose();
  };

  // 复制模板HTML到剪贴板
  const handleCopyTemplate = async (template: SavedTemplate) => {
    try {
      setCopyId(template.id as number);
      await navigator.clipboard.writeText(template.html);
      toast.success(t('templatesList.copySuccess'));
    } catch (error) {
      console.error('复制模板失败:', error);
      toast.error(t('templatesList.copyError'));
    } finally {
      setTimeout(() => setCopyId(null), 800);
    }
  };

  // 下载模板HTML文件
  const handleDownloadTemplate = (template: SavedTemplate) => {
    try {
      setDownloadId(template.id as number);
      const blob = new Blob([template.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.title || 'template'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('templatesList.downloadSuccess'));
      setTimeout(() => setDownloadId(null), 800);
    } catch (error) {
      console.error('下载模板失败:', error);
      toast.error(t('templatesList.downloadError'));
      setDownloadId(null);
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // 关闭弹窗
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // 等待过渡动画完成
  };

  // 当对话框打开时加载模板
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      // 添加延迟以确保动画效果顺畅
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isVisible ? 'bg-gray-900/30 opacity-100' : 'bg-transparent opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col border border-gray-700 transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">{t('templatesList.title')}</h2>
        
        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <span className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              {t('templatesList.noTemplates')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600 relative hover:bg-gray-650 transition-colors duration-200 hover:shadow-lg"
                >
                  <h3 className="font-medium text-white text-lg mb-2 pr-8 truncate" title={template.title}>
                    {template.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {formatDate(template.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="flex cursor-pointer items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 active:bg-blue-700 transition-all duration-200 hover:shadow-md"
                    >
                      <FaEye size={14} />
                      {t('templatesList.use')}
                    </button>
                    <button
                      onClick={() => handleCopyTemplate(template)}
                      className={`flex cursor-pointer items-center gap-1 px-3 py-1 text-white text-sm rounded transition-all duration-200 hover:shadow-md ${
                        copyId === template.id 
                          ? 'bg-green-500 animate-pulse' 
                          : 'bg-green-600 hover:bg-green-500 active:bg-green-700'
                      }`}
                      disabled={copyId === template.id}
                    >
                      {copyId === template.id ? (
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <FaCopy size={14} />
                      )}
                      {t('templatesList.copy')}
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate(template)}
                      className={`flex cursor-pointer items-center gap-1 px-3 py-1 text-white text-sm rounded transition-all duration-200 hover:shadow-md ${
                        downloadId === template.id 
                          ? 'bg-purple-500 animate-pulse' 
                          : 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700'
                      }`}
                      disabled={downloadId === template.id}
                    >
                      {downloadId === template.id ? (
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <FaDownload size={14} />
                      )}
                      {t('templatesList.download')}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id as number)}
                      className={`flex cursor-pointer items-center gap-1 px-3 py-1 text-white text-sm rounded transition-all duration-200 hover:shadow-md ${
                        deleteId === template.id 
                          ? 'bg-red-500 animate-pulse' 
                          : 'bg-red-600 hover:bg-red-500 active:bg-red-700'
                      }`}
                      disabled={deleteId === template.id}
                    >
                      {deleteId === template.id ? (
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
                      ) : (
                        <FaTrash size={14} />
                      )}
                      {t('templatesList.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 active:bg-gray-800 transition-colors duration-200 hover:shadow-md cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesListDialog;