import { useEffect, useState } from "react";
import { PROVIDERS } from "../../../utils/providers.js";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import { MdSettings } from "react-icons/md";
import { useModelStore } from "../../store/modelStore";

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
  api_key?: string;
  base_url?: string;
  model?: string;
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
  
  // 使用全局状态获取环境变量配置
  const { envConfig, fetchModelInfo } = useModelStore();
  
  // 添加测试状态
  const [testStatus, setTestStatus] = useState({
    loading: false,
    tested: false,
    success: false,
    apiKey: false,
    baseUrl: false,
    model: false,
    message: ''
  });
  
  // 模板分类数据
  const [categories, setCategories] = useState<TemplateCategory[]>([
    { id: 'framework', name: t('settings.templates.categories.framework'), templates: [] },
    { id: 'ui', name: t('settings.templates.categories.ui'), templates: [] },
    { id: 'tools', name: t('settings.templates.categories.tools'), templates: [] }
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
    temperature: 0,
    api_key: '',
    base_url: '',
    model: ''
  });

  // 工具库选项（静态）
  const toolLibraries = [
    { id: 'tailwindcss', name: 'Tailwind CSS', description: t('settings.templates.toolDescriptions.tailwindcss') },
    { id: 'vueuse', name: 'VueUse', description: t('settings.templates.toolDescriptions.vueuse') },
    { id: 'dayjs', name: 'Day.js', description: t('settings.templates.toolDescriptions.dayjs') }
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
  const handleParamChange = (param: keyof ModelParameters, value: number | string) => {
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
  
  // 测试连接
  const testConnection = async () => {
    // 准备测试参数
    const testParams = {
      api_key: params.api_key,
      base_url: params.base_url,
      model: params.model
    };
    
    // 检查参数：如果用户没有提供，但后端已配置，则不需要在测试请求中包含
    if (!testParams.api_key && envConfig.apiKey) {
      delete testParams.api_key;
    }
    
    if (!testParams.base_url && envConfig.baseUrl) {
      delete testParams.base_url;
    }
    
    if (!testParams.model && envConfig.model) {
      delete testParams.model;
    }
    
    // 设置测试状态为加载中
    setTestStatus(prev => ({
      ...prev,
      loading: true,
      tested: false,
      message: ''
    }));
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testParams)
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        // 测试成功
        setTestStatus({
          loading: false,
          tested: true,
          success: true,
          apiKey: true,
          baseUrl: true,
          model: true,
          message: t('settings.testSuccess')
        });
      } else {
        // 测试失败
        setTestStatus({
          loading: false,
          tested: true,
          success: false,
          apiKey: false,
          baseUrl: false,
          model: false,
          message: data.message || t('settings.testFailed')
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      // 发生错误
      setTestStatus({
        loading: false,
        tested: true,
        success: false,
        apiKey: false,
        baseUrl: false,
        model: false,
        message: error instanceof Error ? error.message : t('settings.testError')
      });
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
              { id: 'framework', name: t('settings.templates.categories.framework'), templates: frameworkTemplates },
              { id: 'ui', name: t('settings.templates.categories.ui'), templates: uiTemplates },
              { id: 'tools', name: t('settings.templates.categories.tools'), templates: [] }
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

    // 如果打开设置面板，获取模板和环境配置信息
    if (open) {
      fetchTemplates();
      fetchModelInfo(); // 确保获取最新的环境配置
      
      // 如果有传入模型参数，初始化状态
      if (modelParams) {
        setParams(modelParams);
      }
    }
  }, [open, selectedTemplate, selectedUI, selectedTools, modelParams, t, fetchModelInfo]);
  
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
                              <div className="text-xs text-gray-500 mt-0.5">
                                {t(`settings.templates.frameworkDescriptions.${template.id}`)}
                              </div>
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
                    
                    {/* API KEY设置 */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 font-medium flex items-center justify-between">
                        <span>OpenAI API Key</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          testStatus.tested && testStatus.success ? 'bg-green-100 text-green-800' :
                          envConfig.apiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-2 h-2 mr-1.5 rounded-full ${
                            testStatus.tested && testStatus.success ? 'bg-green-500' :
                            envConfig.apiKey ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {testStatus.tested && testStatus.success ? t('settings.verified') :
                          envConfig.apiKey ? t('settings.configured') : t('settings.notConfigured')}
                        </span>
                      </label>
                      <input
                        type="password"
                        value={params.api_key || ''}
                        onChange={(e) => handleParamChange('api_key', e.target.value)}
                        placeholder={t('settings.modelParams.apiKeyPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        {t('settings.modelParams.apiKeyDesc')}
                      </p>
                    </div>
                    
                    {/* Base URL设置 */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 font-medium flex items-center justify-between">
                        <span>API Base URL</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          testStatus.tested && testStatus.success ? 'bg-green-100 text-green-800' :
                          envConfig.baseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-2 h-2 mr-1.5 rounded-full ${
                            testStatus.tested && testStatus.success ? 'bg-green-500' :
                            envConfig.baseUrl ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {testStatus.tested && testStatus.success ? t('settings.verified') :
                          envConfig.baseUrl ? t('settings.configured') : t('settings.notConfigured')}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={params.base_url || ''}
                        onChange={(e) => handleParamChange('base_url', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        {t('settings.modelParams.baseUrlDesc')}
                      </p>
                    </div>
                    
                    {/* Model设置 */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-700 font-medium flex items-center justify-between">
                        <span>Model</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          testStatus.tested && testStatus.success ? 'bg-green-100 text-green-800' :
                          envConfig.model ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-2 h-2 mr-1.5 rounded-full ${
                            testStatus.tested && testStatus.success ? 'bg-green-500' :
                            envConfig.model ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {testStatus.tested && testStatus.success ? t('settings.verified') :
                           envConfig.model ? t('settings.configured') : t('settings.notConfigured')}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={params.model || ''}
                        onChange={(e) => handleParamChange('model', e.target.value)}
                        placeholder="gpt-4o"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        {t('settings.modelParams.modelDesc')}
                      </p>
                    </div>
                    
                    {/* 测试连接按钮 */}
                    <div className="mt-4">
                      <button
                        onClick={testConnection}
                        disabled={testStatus.loading}
                        className={`w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm ${
                          testStatus.loading 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      >
                        {testStatus.loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('settings.testing')}
                          </>
                        ) : (
                          t('settings.testConnection')
                        )}
                      </button>
                      
                      {/* 测试结果信息 */}
                      {testStatus.tested && (
                        <div className={`mt-3 p-3 rounded-md ${
                          testStatus.success ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'
                        }`}>
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {testStatus.success ? (
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">
                                {testStatus.success ? t('settings.testSuccess') : t('settings.testFailed')}
                              </p>
                              {testStatus.message && (
                                <p className="mt-1 text-xs">
                                  {testStatus.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
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
