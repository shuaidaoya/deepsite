import { ReactNode } from "react";
import { MdAdd } from "react-icons/md";
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
        <button
          className="max-md:hidden relative cursor-pointer flex-none flex items-center justify-center rounded-md text-xs font-semibold leading-4 py-1.5 px-3 hover:bg-gray-700 text-gray-100 shadow-sm dark:shadow-highlight/20 bg-gray-800"
          onClick={onReset}
        >
          <MdAdd className="mr-1 text-base" />
          {t('header.new')}
        </button>
        <p className="text-gray-500 text-sm max-md:hidden">
          {t('app.subtitle')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {children}
      </div>
    </header>
  );
}

export default Header;
