import { ReactNode, useEffect } from "react";
import { MdRefresh } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { TbRobot, TbAlertTriangle } from "react-icons/tb";
import { useTranslation } from "react-i18next";

import Logo from "@/assets/logo.svg";
import LanguageSwitcher from "../language-switcher/language-switcher";
import { useModelStore } from "../../store/modelStore";

function Header({
  onReset,
  children,
  modelName
}: {
  onReset: () => void;
  children?: ReactNode;
  modelName?: string;
}) {
  const { t } = useTranslation();
  const { currentModel, envConfig, setCurrentModel, fetchModelInfo } = useModelStore();
  
  // 当props中的modelName变化时更新状态
  useEffect(() => {
    if (modelName) {
      // 如果提供了modelName，优先使用props中传入的值
      setCurrentModel(modelName);
    } else if (!currentModel) {
      // 否则从全局存储获取，如果存储为空则触发API请求
      fetchModelInfo();
    }
  }, [modelName, currentModel, setCurrentModel, fetchModelInfo]);
  
  // 提取模型的简短名称
  const getShortModelName = (modelName: string) => {
    if (!modelName) return "";
    // 提取模型名称中的主要部分
    if (modelName.includes("/")) {
      return modelName.split("/").pop() || modelName;
    }
    return modelName;
  };
  
  // 检查是否配置了模型相关环境变量
  const isModelConfigured = currentModel || (envConfig && (envConfig.model || envConfig.apiKey));
  
  return (
    <header className="border-b border-gray-900 bg-gray-950 px-3 lg:px-6 py-2 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center justify-start gap-3">
        <h1 className="text-white text-lg lg:text-xl font-bold flex items-center justify-start">
          <img
            src={Logo}
            alt="DeepSite Logo"
            className="size-6 lg:size-8 mr-2"
          />
          {t('app.title')}
        </h1>
        <p className="text-gray-700 max-md:hidden">|</p>
        <p className="text-gray-500 text-sm max-md:hidden">
          {t('app.subtitle')}
        </p>
        
        {isModelConfigured ? (
          currentModel && (
            <>
              <p className="text-gray-700 max-md:hidden">|</p>
              <div className="flex items-center text-green-500 text-xs md:text-sm bg-green-900/30 px-2 py-0.5 rounded-full">
                <TbRobot className="mr-1" />
                {getShortModelName(currentModel)}
              </div>
            </>
          )
        ) : (
          <>
            <p className="text-gray-700 max-md:hidden">|</p>
            <div className="flex items-center text-amber-500 text-xs md:text-sm bg-amber-900/30 px-2 py-0.5 rounded-full">
              <TbAlertTriangle className="mr-1" />
              {t('header.modelNotConfigured')}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="relative bg-red-500 hover:bg-red-400 overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-md text-xs lg:text-sm font-semibold py-1.5 px-3 text-white shadow-sm dark:shadow-highlight/20 mx-2 transition-all duration-300"
          onClick={onReset}
          title={t('header.resetTooltip')}
        >
          <MdRefresh className="mr-1 text-lg" />
          {t('header.new')}
        </button>
        
        <LanguageSwitcher />
         
        {children}
        
        <a 
          href="https://github.com/kiritoko1029/deepsite" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaGithub className="text-2xl" />
        </a>
      </div>
    </header>
  );
}

export default Header;
