import classNames from "classnames";
import { PiGearSixFill } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { PROVIDERS } from "../../../utils/providers.js";

// 定义模板接口
interface Template {
  id: string;
  name: string;
  description: string;
}

function Settings({
  open,
  onClose,
  selectedTemplate,
  onTemplateChange,
}: {
  open: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 加载模板列表
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.templates) {
            setTemplates(data.templates);
          }
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchTemplates();
    }
  }, [open]);
  
  return (
    <div className="">
      <button
        className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-base font-semibold size-8 text-center bg-gray-800 hover:bg-gray-700 text-gray-100 shadow-sm dark:shadow-highlight/20"
        onClick={() => {
          onClose((prev) => !prev);
        }}
      >
        <PiGearSixFill />
      </button>
      <div
        className={classNames(
          "h-screen w-screen bg-black/20 fixed left-0 top-0 z-40",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
        onClick={() => onClose(false)}
      ></div>
      <div
        className={classNames(
          "absolute top-0 -translate-y-[calc(100%+16px)] right-0 z-40 w-96 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
          {
            "opacity-0 pointer-events-none": !open,
          }
        )}
      >
        <header className="flex items-center text-sm px-4 py-2 border-b border-gray-200 gap-2 bg-gray-100 font-semibold text-gray-700">
          <span className="text-xs bg-blue-500/10 text-blue-500 rounded-full pl-1.5 pr-2.5 py-0.5 flex items-center justify-start gap-1.5">
            {t('settings.aiInfo')}
          </span>
        </header>
        <main className="px-4 pt-3 pb-4 space-y-4">
          <div className="text-gray-600 text-sm font-medium border p-3 rounded-md flex items-center justify-start gap-2 bg-blue-500/10 border-blue-500/15">
            <img
              src="/logo.svg"
              alt={PROVIDERS.openai.name}
              className="size-5"
            />
            <div>
              <p className="font-semibold text-blue-600">{PROVIDERS.openai.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.maxTokenLimit')}: {PROVIDERS.openai.max_tokens.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* 模板选择 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">选择模板</h3>
            
            {loading ? (
              <div className="flex justify-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className={classNames(
                      "border rounded-md p-3 cursor-pointer hover:border-blue-400 transition-colors",
                      {
                        "border-blue-500 bg-blue-50": selectedTemplate === template.id,
                        "border-gray-200": selectedTemplate !== template.id
                      }
                    )}
                    onClick={() => onTemplateChange(template.id)}
                  >
                    <div className="font-medium text-sm text-gray-800">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-md">
            {t('settings.configHint')}
          </div>
        </main>
      </div>
    </div>
  );
}
export default Settings;
