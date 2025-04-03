/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { RiSparkling2Fill } from "react-icons/ri";
import { GrSend } from "react-icons/gr";
import { toast } from "react-toastify";
import { MdPreview } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { defaultHTML } from "./../../../utils/consts";
import SuccessSound from "./../../assets/success.mp3";
import Settings from "../settings/settings";
// import SpeechPrompt from "../speech-prompt/speech-prompt";

function AskAI({
  html,
  setHtml,
  onScrollToBottom,
  isAiWorking,
  setisAiWorking,
  setView,
  selectedTemplateId,
  onTemplateChange
}: {
  html: string;
  setHtml: (html: string) => void;
  onScrollToBottom: () => void;
  isAiWorking: boolean;
  setView: React.Dispatch<React.SetStateAction<"editor" | "preview">>;
  setisAiWorking: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTemplateId: string;
  onTemplateChange: (templateId: string) => void;
}) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState("");
  const [openSettings, setOpenSettings] = useState(false);

  const audio = new Audio(SuccessSound);
  audio.volume = 0.5;

  // 本地模板变更处理函数
  const handleTemplateChange = (templateId: string) => {
    onTemplateChange(templateId);
    localStorage.setItem("selected_template", templateId);
  };

  const callAi = async () => {
    if (isAiWorking || !prompt.trim()) return;
    setisAiWorking(true);

    let contentResponse = "";
    let lastRenderTime = 0;
    try {
      const request = await fetch("/api/ask-ai", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          ...(html === defaultHTML ? {} : { html }),
          ...(previousPrompt ? { previousPrompt } : {}),
          templateId: selectedTemplateId, // 使用从props传入的模板ID
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
            // 处理 JSON 解析错误
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
            audio.play();
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
            if (now - lastRenderTime > 300) {
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

  return (
    <div
      className={`bg-gray-950 rounded-xl py-2 lg:py-2.5 pl-3.5 lg:pl-4 pr-2 lg:pr-2.5 absolute lg:sticky bottom-3 left-3 lg:bottom-4 lg:left-4 w-[calc(100%-1.5rem)] lg:w-[calc(100%-2rem)] z-10 group ${
        isAiWorking ? "animate-pulse" : ""
      }`}
    >
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
        <RiSparkling2Fill className="text-lg lg:text-xl text-gray-500 group-focus-within:text-pink-500" />
        <input
          type="text"
          disabled={isAiWorking}
          className="w-full bg-transparent max-lg:text-sm outline-none px-3 text-white placeholder:text-gray-500 font-code"
          placeholder={
            hasAsked ? t('askAI.placeholder') : t('askAI.placeholder')
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
          {/* <SpeechPrompt setPrompt={setPrompt} /> */}
          <Settings
            open={openSettings}
            onClose={setOpenSettings}
            selectedTemplate={selectedTemplateId}
            onTemplateChange={handleTemplateChange}
          />
          <button
            disabled={isAiWorking}
            className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold size-8 text-center bg-pink-500 hover:bg-pink-400 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
            onClick={callAi}
          >
            <GrSend className="-translate-x-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AskAI;
