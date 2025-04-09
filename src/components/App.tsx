import { useRef, useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import classNames from "classnames";
import { editor } from "monaco-editor";
import {
  useMount,
  useUnmount,
  useEvent,
  useLocalStorage,
  useSearchParam,
} from "react-use";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import Header from "./header/header";
import { defaultHTML } from "../../utils/consts";
import Tabs from "./tabs/tabs";
import AskAI from "./ask-ai/ask-ai";
import Preview from "./preview/preview";
import Settings from "./settings/settings";
import { ModelParameters } from "./settings/settings";

function App() {
  const { t } = useTranslation();
  const [htmlStorage, , removeHtmlStorage] = useLocalStorage("html_content");
  const remix = useSearchParam("remix");

  const preview = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const resizer = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [html, setHtml] = useState((htmlStorage as string) ?? defaultHTML);
  const [isAiWorking, setisAiWorking] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("vanilla");
  const [selectedUI, setSelectedUI] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [modelParams, setModelParams] = useState<ModelParameters | undefined>();

  const [currentView, setCurrentView] = useState<"editor" | "preview">(
    "editor"
  );

  // 添加设置面板状态
  const [openSettings, setOpenSettings] = useState(false);

  // 处理模板变更
  const handleTemplateChange = (framework: string, ui: string | null, tools: string[]) => {
    // 保存用户选择
    setSelectedTemplateId(framework);
    setSelectedUI(ui);
    setSelectedTools(tools);
    
    // 保存组件库和工具库选择到localStorage
    localStorage.setItem("selected_template", framework);
    if (ui) localStorage.setItem("selected_ui", ui);
    else localStorage.removeItem("selected_ui");
    
    if (tools.length > 0) localStorage.setItem("selected_tools", JSON.stringify(tools));
    else localStorage.removeItem("selected_tools");
    
    // 记录上次使用的模板ID
    localStorage.setItem("last_template_id", framework);
    
    // 确认是否要加载新模板
    if (html !== defaultHTML) {
      if (window.confirm(`是否要将当前HTML替换为${framework}模板的HTML？`)) {
        resetToTemplate(framework);
      }
    } else {
      // 如果是默认HTML，直接加载模板
      resetToTemplate(framework);
    }
  };

  // 处理模型参数变更
  const handleModelParamsChange = (params: ModelParameters) => {
    setModelParams(params);
    localStorage.setItem("model_params", JSON.stringify(params));
  };

  // 监听模板选择变化 - 仅加载已保存的选择，不加载模板
  useEffect(() => {
    const storedTemplateId = localStorage.getItem("selected_template");
    if (storedTemplateId) {
      setSelectedTemplateId(storedTemplateId);
    }
    
    const storedUI = localStorage.getItem("selected_ui");
    if (storedUI) {
      setSelectedUI(storedUI);
    }
    
    const storedTools = localStorage.getItem("selected_tools");
    if (storedTools) {
      try {
        setSelectedTools(JSON.parse(storedTools));
      } catch (e) {
        console.error("Failed to parse stored tools:", e);
      }
    }
    
    // 加载存储的模型参数
    const storedModelParams = localStorage.getItem("model_params");
    if (storedModelParams) {
      try {
        setModelParams(JSON.parse(storedModelParams));
      } catch (e) {
        console.error("Failed to parse stored model params:", e);
      }
    }
  }, []);

  // 重置HTML为指定模板的HTML
  const resetToTemplate = async (templateId: string, shouldShowToast = true) => {
    if (!templateId) return;
    
    if (isAiWorking) {
      toast.warn(t("askAI.working"));
      return;
    }
    
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.template?.html) {
          setHtml(data.template.html);
          removeHtmlStorage();
          editorRef.current?.revealLine(
            editorRef.current?.getModel()?.getLineCount() ?? 0
          );
          if (shouldShowToast) {
            toast.success(t("toast.templateLoaded", { name: data.template.name }));
          }
        }
      } else {
        toast.error(t("toast.templateLoadFailed"));
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error(t("toast.templateLoadError"));
    }
  };

  const fetchRemix = async () => {
    if (!remix) return;
    const res = await fetch(`/api/remix/${remix}`);
    if (res.ok) {
      const data = await res.json();
      if (data.html) {
        setHtml(data.html);
        toast.success(t("toast.remixLoaded"));
      }
    } else {
      toast.error(t("toast.remixFailed"));
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("remix");
    window.history.replaceState({}, document.title, url.toString());
  };

  /**
   * Resets the layout based on screen size
   * - For desktop: Sets editor to 1/3 width and preview to 2/3
   * - For mobile: Removes inline styles to let CSS handle it
   */
  const resetLayout = () => {
    if (!editor.current || !preview.current) return;

    // lg breakpoint is 1024px based on useBreakpoint definition and Tailwind defaults
    if (window.innerWidth >= 1024) {
      // Set initial 1/3 - 2/3 sizes for large screens, accounting for resizer width
      const resizerWidth = resizer.current?.offsetWidth ?? 8; // w-2 = 0.5rem = 8px
      const availableWidth = window.innerWidth - resizerWidth;
      const initialEditorWidth = availableWidth / 3; // Editor takes 1/3 of space
      const initialPreviewWidth = availableWidth - initialEditorWidth; // Preview takes 2/3
      editor.current.style.width = `${initialEditorWidth}px`;
      preview.current.style.width = `${initialPreviewWidth}px`;
    } else {
      // Remove inline styles for smaller screens, let CSS flex-col handle it
      editor.current.style.width = "";
      preview.current.style.width = "";
    }
  };

  /**
   * Handles resizing when the user drags the resizer
   * Ensures minimum widths are maintained for both panels
   */
  const handleResize = (e: MouseEvent) => {
    if (!editor.current || !preview.current || !resizer.current) return;

    const resizerWidth = resizer.current.offsetWidth;
    const minWidth = 100; // Minimum width for editor/preview
    const maxWidth = window.innerWidth - resizerWidth - minWidth;

    const editorWidth = e.clientX;
    const clampedEditorWidth = Math.max(
      minWidth,
      Math.min(editorWidth, maxWidth)
    );
    const calculatedPreviewWidth =
      window.innerWidth - clampedEditorWidth - resizerWidth;

    editor.current.style.width = `${clampedEditorWidth}px`;
    preview.current.style.width = `${calculatedPreviewWidth}px`;
  };

  const handleMouseDown = () => {
    setIsResizing(true);
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Prevent accidental navigation away when AI is working or content has changed
  useEvent("beforeunload", (e) => {
    if (isAiWorking || html !== defaultHTML) {
      e.preventDefault();
      return "";
    }
  });

  // Initialize component on mount
  useMount(() => {
    fetchRemix();

    // Restore content from storage if available
    if (htmlStorage) {
      removeHtmlStorage();
      toast.warn(t("toast.contentRestored"));
    } else {
      // 仅当没有已保存HTML内容，且是首次加载时，静默加载默认模板
      const isFirstLoad = !localStorage.getItem("app_initialized");
      if (isFirstLoad && html === defaultHTML) {
        resetToTemplate(selectedTemplateId, false); // 静默加载
      }
    }
    
    // 设置应用初始化标记
    localStorage.setItem("app_initialized", "true");
    localStorage.setItem("last_template_id", selectedTemplateId);

    // Set initial layout based on window size
    resetLayout();

    // Attach event listeners
    if (!resizer.current) return;
    resizer.current.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("resize", resetLayout);
  });

  // Clean up event listeners on unmount
  useUnmount(() => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", handleMouseUp);
    if (resizer.current) {
      resizer.current.removeEventListener("mousedown", handleMouseDown);
    }
    window.removeEventListener("resize", resetLayout);
  });

  // 自动保存 HTML 内容到本地存储（后台静默保存，无需用户操作）
  useEffect(() => {
    // 只有当 HTML 内容变化且不是默认内容时才保存
    if (html !== defaultHTML) {
      localStorage.setItem("html_content", html);
    }
  }, [html]);

  return (
    <div className="h-screen bg-gray-950 font-sans overflow-hidden">
      <Header
        onReset={() => {
          if (isAiWorking) {
            toast.warn(t("askAI.working"));
            return;
          }
          if (
            window.confirm(t("editor.resetConfirm"))
          ) {
            resetToTemplate(selectedTemplateId);
          }
        }}
      >
        <Settings
          open={openSettings}
          onClose={setOpenSettings}
          selectedTemplate={selectedTemplateId}
          selectedUI={selectedUI}
          selectedTools={selectedTools}
          modelParams={modelParams}
          onTemplateChange={handleTemplateChange}
          onModelParamsChange={handleModelParamsChange}
        />
      </Header>
      <main className="max-lg:flex-col flex w-full">
        <div
          ref={editor}
          className={classNames(
            "w-full h-[calc(100dvh-49px)] lg:h-[calc(100dvh-54px)] relative overflow-hidden max-lg:transition-all max-lg:duration-200 select-none",
            {
              "max-lg:h-0": currentView === "preview",
            }
          )}
        >
          <Tabs />
          <div
            onClick={(e) => {
              if (isAiWorking) {
                e.preventDefault();
                e.stopPropagation();
                toast.warn(t("askAI.working"));
              }
            }}
          >
            <Editor
              language="html"
              theme="vs-dark"
              className={classNames(
                "h-[calc(100dvh-90px)] lg:h-[calc(100dvh-96px)]",
                {
                  "pointer-events-none": isAiWorking,
                }
              )}
              value={html}
              onValidate={(markers) => {
                if (markers?.length > 0) {
                  // todo
                }
              }}
              onChange={(value) => {
                const newValue = value ?? "";
                setHtml(newValue);
              }}
              onMount={(editor) => (editorRef.current = editor)}
            />
          </div>
          <AskAI
            html={html}
            setHtml={setHtml}
            isAiWorking={isAiWorking}
            setisAiWorking={setisAiWorking}
            setView={setCurrentView}
            selectedTemplateId={selectedTemplateId}
            selectedUI={selectedUI}
            selectedTools={selectedTools}
            onTemplateChange={handleTemplateChange}
            onScrollToBottom={() => {
              editorRef.current?.revealLine(
                editorRef.current?.getModel()?.getLineCount() ?? 0
              );
            }}
            modelParams={modelParams}
            onModelParamsChange={handleModelParamsChange}
          />
        </div>
        <div
          ref={resizer}
          className="bg-gray-700 hover:bg-blue-500 w-2 cursor-col-resize h-[calc(100dvh-53px)] max-lg:hidden"
        />
        <Preview
          html={html}
          isResizing={isResizing}
          isAiWorking={isAiWorking}
          ref={preview}
          setView={setCurrentView}
          setHtml={setHtml}
        />
      </main>
    </div>
  );
}

export default App;
