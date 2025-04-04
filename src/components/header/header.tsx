import { ReactNode } from "react";
import { MdRefresh } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import Logo from "@/assets/logo.svg";
import LanguageSwitcher from "../language-switcher/language-switcher";

function Header({
  onReset,
  children,
}: {
  onReset: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  
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
