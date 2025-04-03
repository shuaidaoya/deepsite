import classNames from "classnames";
import { useRef } from "react";
import { TbReload } from "react-icons/tb";
import { toast } from "react-toastify";
import { FaLaptopCode } from "react-icons/fa6";
import PreviewActions from "./preview-actions";
import { useTranslation } from "react-i18next";

function Preview({
  html,
  isResizing,
  isAiWorking,
  setView,
  setHtml,
  ref,
}: {
  html: string;
  isResizing: boolean;
  isAiWorking: boolean;
  setView: React.Dispatch<React.SetStateAction<"editor" | "preview">>;
  setHtml?: (html: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleRefreshIframe = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const content = iframe.srcdoc;
      iframe.srcdoc = "";
      setTimeout(() => {
        iframe.srcdoc = content;
      }, 10);
    }
  };

  // 处理加载模板
  const handleLoadTemplate = (templateHtml: string) => {
    if (setHtml) {
      setHtml(templateHtml);
      toast.success(t('preview.templateLoaded'));
    }
  };

  return (
    <div
      ref={ref}
      className="w-full border-l border-gray-900 bg-white h-[calc(100dvh-49px)] lg:h-[calc(100dvh-53px)] relative"
      onClick={(e) => {
        if (isAiWorking) {
          e.preventDefault();
          e.stopPropagation();
          toast.warn(t("askAI.working"));
        }
      }}
    >
      <iframe
        ref={iframeRef}
        title="output"
        className={classNames("w-full h-full select-none", {
          "pointer-events-none": isResizing || isAiWorking,
        })}
        srcDoc={html}
      />
      {!isAiWorking && (
        <div className="flex items-center justify-between gap-3 absolute bottom-3 lg:bottom-5 right-3 left-3 lg:right-5 lg:left-auto">
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden bg-gray-950 shadow-md text-white text-xs lg:text-sm font-medium py-2 px-3 lg:px-4 rounded-lg flex items-center gap-2 border border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer"
            onClick={() => setView("editor")}
          >
            <FaLaptopCode />
            {t("preview.backToEditor")}
          </button>
          <button
            className="bg-white lg:bg-gray-950 shadow-md text-gray-950 lg:text-white text-xs lg:text-sm font-medium py-2 px-3 lg:px-4 rounded-lg flex items-center gap-2 border border-gray-100 lg:border-gray-900 hover:brightness-150 transition-all duration-100 cursor-pointer"
            onClick={handleRefreshIframe}
          >
            <TbReload />
            {t("preview.refreshPreview")}
          </button>
        </div>
        <PreviewActions html={html} isDisabled={isAiWorking || isResizing} onLoadTemplate={handleLoadTemplate} />
      </div>
      )}
    </div>
  );
}

export default Preview;
