/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { RiSparkling2Fill } from "react-icons/ri";
import { GrSend } from "react-icons/gr";
import { toast } from "react-toastify";
import { MdPreview } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import { defaultHTML } from "./../../../utils/consts";
import SuccessSound from "./../../assets/success.mp3";
import { ModelParameters } from "../settings/settings";
import { TbWand } from "react-icons/tb";
// import SpeechPrompt from "../speech-prompt/speech-prompt";

function AskAI({
  html,
  setHtml,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  setView,
  selectedTemplateId,
  selectedUI,
  selectedTools,
  onTemplateChange,
  modelParams,
  onModelParamsChange
}: {
  html: string;
  setHtml: (html: string) => void;
  onScrollToBottom: () => void;
  isAiWorking: boolean;
  setView: React.Dispatch<React.SetStateAction<"editor" | "preview">>;
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplateId: string;
  selectedUI: string | null;
  selectedTools: string[];
  onTemplateChange: (templateId: string, ui: string | null, tools: string[]) => void;
  modelParams?: ModelParameters;
  onModelParamsChange?: (params: ModelParameters) => void;
}) {
  const { t, i18n } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState("");
  const [progress, setProgress] = useState(0); // 添加生成进度状态

  // 音频在需要时再创建
  const playSuccessSound = () => {
    const audio = new Audio(SuccessSound);
    audio.volume = 0.5;
    audio.play();
  };

  // 模拟进度条动画
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (isAiWorking) {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prevProgress => {
          // 缓慢增加进度，但不会达到100%，直到实际完成才会设为100%
          if (prevProgress < 95) {
            return prevProgress + (95 - prevProgress) * 0.1;
          }
          return prevProgress;
        });
      }, 300);
    } else {
      // AI完成工作后，快速完成进度条
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
      }, 600);
    }
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isAiWorking]);

  const callAi = async () => {
    if (isAiWorking || !prompt.trim()) return;
    setisAiWorking(true);

    let contentResponse = "";
    let lastRenderTime = 0;
    try {
      // 获取当前用户语言
      const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
      
      const request = await fetch("/api/ask-ai", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          ...(html === defaultHTML ? {} : { html }),
          ...(previousPrompt ? { previousPrompt } : {}),
          templateId: selectedTemplateId, 
          ui: selectedUI, 
          tools: selectedTools, 
          language: currentLanguage, 
          ...(modelParams ? {
            max_tokens: modelParams.max_tokens,
            temperature: modelParams.temperature
          } : {})
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (request && request.body) {
        if (!request.ok) {
          try {
            const res = await request.json();
            toast.error(res.message || "An error occurred while requesting AI");
          } catch (parseError) {
            toast.error("Failed to process response from server");
            console.error("JSON parsing error:", parseError);
          }
          setisAiWorking(false);
          return;
        }
        const reader = request.body.getReader();
        const decoder = new TextDecoder("utf-8");

        const read = async () => {
          const { done, value } = await reader.read();
          if (done) {
            toast.success("AI responded successfully");
            setPrompt("");
            setPreviousPrompt(prompt);
            setisAiWorking(false);
            setHasAsked(true);
            playSuccessSound(); // 使用函数播放音效
            setView("preview");

            // Now we have the complete HTML including </html>, so set it to be sure
            const finalDoc = contentResponse.match(
              /<!DOCTYPE html>[\s\S]*<\/html>/
            )?.[0];
            if (finalDoc) {
              setHtml(finalDoc);
            } else if (contentResponse.includes("<html") && contentResponse.includes("<body")) {
              // 尝试修复可能不完整的 HTML
              let fixedHtml = contentResponse;
              if (!fixedHtml.includes("</body>")) {
                fixedHtml += "\n</body>";
              }
              if (!fixedHtml.includes("</html>")) {
                fixedHtml += "\n</html>";
              }
              setHtml(fixedHtml);
            }

            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          contentResponse += chunk;
          
          // 尝试多种方式匹配有效的 HTML 内容
          let newHtml = null;
          
          // 1. 尝试匹配完整的 DOCTYPE 开头
          const doctypeMatch = contentResponse.match(/<!DOCTYPE html>[\s\S]*/);
          if (doctypeMatch) {
            newHtml = doctypeMatch[0];
          } 
          // 2. 尝试匹配 <html 开头
          else {
            const htmlMatch = contentResponse.match(/<html[\s\S]*/);
            if (htmlMatch) {
              newHtml = htmlMatch[0];
            }
            // 3. 尝试匹配 <body 开头
            else {
              const bodyMatch = contentResponse.match(/<body[\s\S]*/);
              if (bodyMatch) {
                newHtml = bodyMatch[0];
              }
            }
          }
          
          if (newHtml) {
            // Force-close the HTML tag so the iframe doesn't render half-finished markup
            let partialDoc = newHtml;
            if (!partialDoc.includes("</body>") && partialDoc.includes("<body")) {
              partialDoc += "\n</body>";
            }
            if (!partialDoc.includes("</html>")) {
              partialDoc += "\n</html>";
            }

            // Throttle the re-renders to avoid flashing/flicker
            const now = Date.now();
            if (now - lastRenderTime > 1000) {
              setHtml(partialDoc);
              lastRenderTime = now;
            }

            if (partialDoc.length > 200) {
              onScrollToBottom();
            }
          }
          read();
        };

        read();
      }

       
    } catch (error: any) {
      setisAiWorking(false);
      toast.error(error.message);
    }
  };

  // 添加优化提示词功能
  const optimizePrompt = async () => {
    if (isAiWorking || !prompt.trim()) return;
    setisAiWorking(true);
    
    try {
      // 获取当前用户语言
      const currentLanguage = i18n.language.startsWith('zh') ? 'zh' : 'en';
      
      const response = await fetch("/api/optimize-prompt", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          language: currentLanguage
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || t('errors.optimizePromptFailed'));
        setisAiWorking(false);
        return;
      }
      
      const result = await response.json();
      if (result.optimizedPrompt) {
        setPrompt(result.optimizedPrompt);
        toast.success(t('askAI.promptOptimized'));
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.optimizePromptFailed'));
    } finally {
      setisAiWorking(false);
    }
  };

  return (
    <div
      className={`bg-gray-950 rounded-xl py-2 lg:py-2.5 pl-3.5 lg:pl-4 pr-2 lg:pr-2.5 absolute lg:sticky bottom-3 left-3 lg:bottom-4 lg:left-4 w-[calc(100%-1.5rem)] lg:w-[calc(100%-2rem)] z-10 group relative overflow-hidden ${
        isAiWorking ? "shadow-lg shadow-pink-500/10" : ""
      }`}
    >
      {/* 进度条 */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}></div>
      )}
      
      {defaultHTML !== html && (
        <button
          className="bg-white lg:hidden -translate-y-[calc(100%+8px)] absolute left-0 top-0 shadow-md text-gray-950 text-xs font-medium py-2 px-3 lg:px-4 rounded-lg flex items-center gap-2 border border-gray-100 hover:brightness-150 transition-all duration-100 cursor-pointer"
          onClick={() => setView("preview")}
        >
          <MdPreview />
          {t('tabs.preview')}
        </button>
      )}
      <div className="w-full relative flex items-center justify-between">
        <RiSparkling2Fill className={`text-lg lg:text-xl transition-colors duration-300 ${isAiWorking ? "text-pink-500" : "text-gray-500 group-focus-within:text-pink-500"}`} />
        <input
          type="text"
          disabled={isAiWorking}
          className="w-full bg-transparent max-lg:text-sm outline-none px-3 text-white placeholder:text-gray-500 font-code transition-all duration-300"
          placeholder={
            isAiWorking 
              ? t('askAI.working')
              : (hasAsked ? t('askAI.placeholder') : t('askAI.placeholder'))
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              callAi();
            }
          }}
        />
        <div className="flex items-center justify-end gap-2">
          {/* 优化提示词按钮 */}
          <button
            disabled={isAiWorking || !prompt.trim()}
            title={t('askAI.optimizePromptTooltip')}
            className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold size-8 text-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            onClick={optimizePrompt}
          >
            <TbWand className="text-lg" />
          </button>
          <button
            disabled={isAiWorking}
            className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold size-8 text-center bg-pink-500 hover:bg-pink-400 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            onClick={callAi}
          >
            {isAiWorking ? (
              <BiLoaderAlt className="text-lg animate-spin" />
            ) : (
              <GrSend className="-translate-x-[1px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AskAI;
