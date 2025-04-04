import { useEffect, useState } from "react";
import { PROVIDERS } from "../../../utils/providers.js";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { MdSettings } from "react-icons/md";

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

// 定义模型参数接口
export interface ModelParameters {
  max_tokens: number;
  temperature: number;
}

// 定义选择回调函数的类型
interface TemplateSelectionCallback {
  (framework: string, ui: string | null, tools: string[]): void;
}

// 定义模型参数回调函数的类型
interface ModelParamsCallback {
  (params: ModelParameters): void;
}

function Settings({
  open,
  onClose,
  selectedTemplate,
  selectedUI,
  selectedTools,
  modelParams,
  onTemplateChange,
  onModelParamsChange,
}: {
  open: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplate: string;
  selectedUI: string | null;
  selectedTools: string[];
  modelParams?: ModelParameters;
  onTemplateChange: TemplateSelectionCallback;
  onModelParamsChange?: ModelParamsCallback;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'model'>('templates');
  
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

  // 模型参数
  const [params, setParams] = useState<ModelParameters>({
    max_tokens: 64000,
    temperature: 0
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

  // 处理模型参数变更
  const handleParamChange = (param: keyof ModelParameters, value: number) => {
    setParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 应用模板选择
  const applyTemplateSelection = () => {
    if (selected.framework) {
      onTemplateChange(selected.framework, selected.ui, selected.tools);
      
      // 如果有模型参数变更，也应用它们
      if (onModelParamsChange) {
        onModelParamsChange(params);
      }
      
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
      
      // 如果有传入模型参数，初始化状态
      if (modelParams) {
        setParams(modelParams);
      }
    }
  }, [open, selectedTemplate, selectedUI, selectedTools, modelParams]);
  
  return (
    <>
      {/* 设置按钮 */}
      <button
        onClick={() => onClose(true)}
        title={t('settings.title')}
        className="relative cursor-pointer flex items-center justify-center rounded-full w-9 h-9 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-200"
      >
        <MdSettings className="text-2xl" />
      </button>

      {/* 弹出层对话框 */}
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
            "bg-white rounded-xl shadow-xl max-w-xl w-full h-[min(90vh,650px)] transform transition-all duration-200 flex flex-col",
            {
              "opacity-0 scale-95": !open,
              "opacity-100 scale-100": open
            }
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between text-sm p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <span className="font-semibold text-gray-700">{t('settings.title')}</span>
          </header>
          
          {/* 标签页切换 */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1 px-4 pt-2">
              <button
                onClick={() => setActiveTab('templates')}
                className={classNames("px-4 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer", {
                  "bg-white border-b-2 border-blue-500 text-blue-600": activeTab === 'templates',
                  "text-gray-500 hover:text-gray-700": activeTab !== 'templates'
                })}
              >
                {t('settings.templateTab')}
              </button>
              <button
                onClick={() => setActiveTab('model')}
                className={classNames("px-4 py-2 rounded-t-lg font-medium text-sm transition-all duration-200 cursor-pointer", {
                  "bg-white border-b-2 border-blue-500 text-blue-600": activeTab === 'model',
                  "text-gray-500 hover:text-gray-700": activeTab !== 'model'
                })}
              >
                {t('settings.modelTab')}
              </button>
            </nav>
          </div>
          
          <div className="p-5 flex-1 overflow-hidden">
            {/* AI提供商信息 */}
            <div className="text-gray-600 text-sm font-medium border p-3 rounded-md flex items-center justify-start gap-2 bg-blue-500/10 border-blue-500/15 mb-4">
              <img
                src="/logo.svg"
                alt={PROVIDERS.openai.name}
                className="size-5"
              />
              <div>
                <p className="font-semibold text-blue-600">{PROVIDERS.openai.name}</p>
              </div>
            </div>
            
            {/* 内容区使用固定高度并添加过渡动画 */}
            <div className="relative h-[calc(min(90vh,650px)-250px)]">
              {/* 模板选择内容 */}
              <div 
                className={classNames(
                  "transition-all duration-300 ease-out absolute inset-0 w-full overflow-y-auto h-full",
                  activeTab === 'templates' ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-30px] pointer-events-none"
                )}
              >
                {loading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 框架选择 */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="bg-indigo-100 text-indigo-800 text-xs py-0.5 px-2 rounded mr-2">1</span>
                        {t('settings.templates.framework')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 rounded-md bg-gray-50 p-3">
                        {categories[0].templates.map((template) => (
                          <label 
                            key={template.id}
                            className={classNames(
                              "flex items-center border rounded-md p-2.5 cursor-pointer hover:border-indigo-400 transition-colors bg-white",
                              {
                                "border-indigo-500 bg-indigo-50": selected.framework === template.id,
                                "border-gray-200": selected.framework !== template.id
                              }
                            )}
                          >
                            <input 
                              type="radio" 
                              name="framework"
                              className="mr-2 h-4 w-4 text-indigo-600"
                              checked={selected.framework === template.id}
                              onChange={() => handleSingleSelect('framework', template.id)}
                            />
                            <div>
                              <div className="font-medium text-sm text-gray-800">{template.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    {/* 组件库选择 */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="bg-emerald-100 text-emerald-800 text-xs py-0.5 px-2 rounded mr-2">2</span>
                        {t('settings.templates.ui')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 rounded-md bg-gray-50 p-3">
                        {selected.framework !== 'vue3' ? (
                          <div className="col-span-2 py-3 px-4 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-100">
                            {t('settings.templates.requireVue3')}
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 mb-2 text-xs text-gray-500 px-1">
                              {t('settings.templates.uiOptional')}
                            </div>
                            {categories[1].templates.map((template) => (
                              <label 
                                key={template.id}
                                className={classNames(
                                  "flex items-center border rounded-md p-2.5 cursor-pointer hover:border-emerald-400 transition-colors bg-white",
                                  {
                                    "border-emerald-500 bg-emerald-50": selected.ui === template.id,
                                    "border-gray-200": selected.ui !== template.id
                                  }
                                )}
                              >
                                <input 
                                  type="checkbox" 
                                  name="ui"
                                  className="mr-2 h-4 w-4 text-emerald-600"
                                  checked={selected.ui === template.id}
                                  onChange={() => handleSingleSelect('ui', template.id)}
                                />
                                <div>
                                  <div className="font-medium text-sm text-gray-800">{template.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                                </div>
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* 工具库选择 */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <span className="bg-amber-100 text-amber-800 text-xs py-0.5 px-2 rounded mr-2">3</span>
                        {t('settings.templates.tools')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 rounded-md bg-gray-50 p-3">
                        {!selected.framework ? (
                          <div className="col-span-2 py-3 px-4 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-100">
                            {t('settings.templates.requireFramework')}
                          </div>
                        ) : (
                          <>
                            <div className="col-span-2 mb-2 text-xs text-gray-500 px-1">
                              {t('settings.templates.toolsMultiSelect')}
                            </div>
                            {toolLibraries.map((tool) => (
                              <label 
                                key={tool.id}
                                className={classNames(
                                  "flex items-center border rounded-md p-2.5 cursor-pointer hover:border-amber-400 transition-colors bg-white",
                                  {
                                    "border-amber-500 bg-amber-50": selected.tools.includes(tool.id),
                                    "border-gray-200": !selected.tools.includes(tool.id)
                                  }
                                )}
                              >
                                <input 
                                  type="checkbox" 
                                  name="tools"
                                  className="mr-2 h-4 w-4 text-amber-600"
                                  checked={selected.tools.includes(tool.id)}
                                  onChange={() => handleToolSelect(tool.id)}
                                />
                                <div>
                                  <div className="font-medium text-sm text-gray-800">{tool.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{tool.description}</div>
                                </div>
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-md">
                      {t('settings.configHint')}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 模型参数配置内容 */}
              <div 
                className={classNames(
                  "transition-all duration-300 ease-out absolute inset-0 w-full overflow-y-auto h-full",
                  activeTab === 'model' ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[30px] pointer-events-none"
                )}
              >
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">{t('settings.modelParams.title')}</h3>
                    
                    {/* max_tokens设置 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-700">
                          {t('settings.modelParams.maxTokens')}
                        </label>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          {params.max_tokens.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1000"
                        max="128000"
                        step="1000"
                        value={params.max_tokens}
                        onChange={(e) => handleParamChange('max_tokens', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1K</span>
                        <span>32K</span>
                        <span>64K</span>
                        <span>128K</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('settings.modelParams.maxTokensDesc')}
                      </p>
                    </div>
                    
                    {/* temperature设置 */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-700">
                          {t('settings.modelParams.temperature')}
                        </label>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          {params.temperature}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={params.temperature}
                        onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{t('settings.modelParams.precise')}</span>
                        <span>{t('settings.modelParams.balanced')}</span>
                        <span>{t('settings.modelParams.creative')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('settings.modelParams.temperatureDesc')}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                      {t('settings.modelParams.defaultValues')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部操作按钮 */}
          <footer className="p-4 border-t border-gray-200 flex justify-end space-x-3 mt-auto">
            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={applyTemplateSelection}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              disabled={!selected.framework}
            >
              {t('settings.applySettings')}
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
export default Settings;
