import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

function DeployButton() {
  const { t } = useTranslation();

  return (
    <div className="relative flex items-center justify-end">
      <button
        className="relative cursor-pointer flex-none flex items-center justify-center rounded-md text-xs lg:text-sm font-semibold leading-5 lg:leading-6 py-1.5 px-5 bg-pink-500 hover:bg-pink-400 text-white shadow-sm dark:shadow-highlight/20"
        onClick={() => {
          toast.info("部署功能已被移除");
        }}
      >
        {t('deploy.deploy')}
      </button>
    </div>
  );
}

export default DeployButton;
