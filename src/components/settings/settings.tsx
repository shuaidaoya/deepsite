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

// 定义模板类别
interface TemplateCategory {
  id: string;
  name: string;
  templates: Template[];
}

// 定义已选择的模板配置
interface SelectedTemplates {
  framework: string | null;
  ui: string | null;
  tools: string[];
}

// 定义选择回调函数的类型
interface TemplateSelectionCallback {
  (framework: string, ui: string | null, tools: string[]): void;
}

function Settings({
  open,
  onClose,
  selectedTemplate,
  selectedUI,
  selectedTools,
  onTemplateChange,
}: {
  open: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplate: string;
  selectedUI: string | null;
  selectedTools: string[];
  onTemplateChange: TemplateSelectionCallback;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  // 模板分类数据
  const [categories, setCategories] = useState<TemplateCategory[]>([
    { id: 'framework', name: '框架', templates: [] },
    { id: 'ui', name: '组件库', templates: [] },
    { id: 'tools', name: '工具库', templates: [] }
  ]);

  // 用户选择的模板配置
  const [selected, setSelected] = useState<SelectedTemplates>({
    framework: null,
    ui: null,
    tools: []
  });

  // 工具库选项（静态）
  const toolLibraries = [
    { id: 'tailwindcss', name: 'Tailwind CSS', description: '实用工具优先的CSS框架' },
    { id: 'vueuse', name: 'VueUse', description: 'Vue Composition API 实用工具集' },
    { id: 'dayjs', name: 'Day.js', description: '轻量级日期处理库' }
  ];
  
  // 处理框架或组件库选择
  const handleSingleSelect = (type: 'framework' | 'ui', id: string) => {
    if (type === 'framework') {
      // 如果更改框架，且新框架不是Vue3，清除UI选择
      if (id !== 'vue3') {
        setSelected(prev => ({
          ...prev,
          [type]: prev[type] === id ? null : id,
          ui: null // 当选择非Vue框架时，清除UI选择
        }));
      } else {
        setSelected(prev => ({
          ...prev,
          [type]: prev[type] === id ? null : id
        }));
      }
    } else {
      setSelected(prev => ({
        ...prev,
        [type]: prev[type] === id ? null : id
      }));
    }
  };
  
  // 处理工具库多选
  const handleToolSelect = (id: string) => {
    setSelected(prev => {
      if (prev.tools.includes(id)) {
        return {
          ...prev,
          tools: prev.tools.filter(item => item !== id)
        };
      } else {
        return {
          ...prev,
          tools: [...prev.tools, id]
        };
      }
    });
  };

  // 应用模板选择
  const applyTemplateSelection = () => {
    if (selected.framework) {
      onTemplateChange(selected.framework, selected.ui, selected.tools);
      onClose(false);
    }
  };
  
  // 加载模板列表和初始化选择
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.templates) {
            // 对模板进行分类
            const frameworkTemplates = data.templates.filter((t: Template) => 
              ['vanilla', 'vue3'].includes(t.id)
            );
            
            const uiTemplates = data.templates.filter((t: Template) => 
              ['elementPlus', 'naiveUI'].includes(t.id)
            );
            
            setCategories([
              { id: 'framework', name: '框架', templates: frameworkTemplates },
              { id: 'ui', name: '组件库', templates: uiTemplates },
              { id: 'tools', name: '工具库', templates: [] }
            ]);
            
            // 设置初始选择
            setSelected({
              framework: selectedTemplate,
              ui: selectedUI,
              tools: selectedTools || []
            });
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
  }, [open, selectedTemplate, selectedUI, selectedTools]);
  
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
      
      {/* 背景遮罩 */}
      <div
        className={classNames(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 flex items-center justify-center",
          {
            "opacity-0 pointer-events-none": !open,
            "opacity-100": open
          }
        )}
        onClick={(e) => {
          // 仅当点击背景时关闭，防止点击内容区域时关闭
          if (e.target === e.currentTarget) {
            onClose(false);
          }
        }}
      >
        {/* 弹出框内容 */}
        <div
          className={classNames(
            "bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] transform transition-all duration-200",
            {
              "opacity-0 scale-95": !open,
              "opacity-100 scale-100": open
            }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between text-sm p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <span className="font-semibold text-gray-700">模板与工具设置</span>
            <span className="text-xs bg-blue-500/10 text-blue-500 rounded-full px-2.5 py-0.5">
              {t('settings.aiInfo')}
            </span>
          </header>
          
          <div className="overflow-y-auto p-4 max-h-[calc(85vh-130px)]">
            <div className="space-y-5">
              {/* AI提供商信息 */}
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
              
              {/* 模板选择 - 分类展示 */}
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* 框架选择 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="bg-indigo-100 text-indigo-800 text-xs py-0.5 px-2 rounded mr-2">1</span>
                      选择框架
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 rounded-md bg-gray-50 p-2">
                      {categories[0].templates.map((template) => (
                        <label 
                          key={template.id}
                          className={classNames(
                            "flex items-center border rounded-md p-3 cursor-pointer hover:border-indigo-400 transition-colors bg-white",
                            {
                              "border-indigo-500 bg-indigo-50": selected.framework === template.id,
                              "border-gray-200": selected.framework !== template.id
                            }
                          )}
                        >
                          <input 
                            type="radio" 
                            name="framework"
                            className="mr-3 h-4 w-4 text-indigo-600"
                            checked={selected.framework === template.id}
                            onChange={() => handleSingleSelect('framework', template.id)}
                          />
                          <div>
                            <div className="font-medium text-sm text-gray-800">{template.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* 组件库选择 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="bg-emerald-100 text-emerald-800 text-xs py-0.5 px-2 rounded mr-2">2</span>
                      选择组件库
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 rounded-md bg-gray-50 p-2">
                      {selected.framework !== 'vue3' ? (
                        <div className="py-3 px-4 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-100">
                          请先选择Vue 3框架才能使用组件库
                        </div>
                      ) : (
                        categories[1].templates.map((template) => (
                          <label 
                            key={template.id}
                            className={classNames(
                              "flex items-center border rounded-md p-3 cursor-pointer hover:border-emerald-400 transition-colors bg-white",
                              {
                                "border-emerald-500 bg-emerald-50": selected.ui === template.id,
                                "border-gray-200": selected.ui !== template.id
                              }
                            )}
                          >
                            <input 
                              type="radio" 
                              name="ui"
                              className="mr-3 h-4 w-4 text-emerald-600"
                              checked={selected.ui === template.id}
                              onChange={() => handleSingleSelect('ui', template.id)}
                            />
                            <div>
                              <div className="font-medium text-sm text-gray-800">{template.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* 工具库选择 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center">
                      <span className="bg-amber-100 text-amber-800 text-xs py-0.5 px-2 rounded mr-2">3</span>
                      选择工具库（可多选）
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 rounded-md bg-gray-50 p-2">
                      {toolLibraries.map((tool) => (
                        <label 
                          key={tool.id}
                          className={classNames(
                            "flex items-center border rounded-md p-3 cursor-pointer hover:border-amber-400 transition-colors bg-white",
                            {
                              "border-amber-500 bg-amber-50": selected.tools.includes(tool.id),
                              "border-gray-200": !selected.tools.includes(tool.id)
                            }
                          )}
                        >
                          <input 
                            type="checkbox" 
                            className="mr-3 h-4 w-4 text-amber-600 rounded"
                            checked={selected.tools.includes(tool.id)}
                            onChange={() => handleToolSelect(tool.id)}
                          />
                          <div>
                            <div className="font-medium text-sm text-gray-800">{tool.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-md">
                    {t('settings.configHint')}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 底部操作按钮 */}
          <footer className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
            <button 
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              onClick={() => onClose(false)}
            >
              取消
            </button>
            <button
              className={classNames(
                "px-4 py-2 text-sm font-medium rounded-md text-white",
                {
                  "bg-blue-600 hover:bg-blue-700": selected.framework,
                  "bg-gray-400 cursor-not-allowed": !selected.framework
                }
              )}
              onClick={applyTemplateSelection}
              disabled={!selected.framework}
            >
              应用选择
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
export default Settings;
