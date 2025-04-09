/* eslint-disable @typescript-eslint/no-explicit-any */
 
import { useState, useEffect, useRef } from "react";
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
import { IoMdTime } from "react-icons/io";
// import SpeechPrompt from "../speech-prompt/speech-prompt";

// 定义对话消息的接口
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 自定义工具提示组件
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// 对话详情弹窗组件
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Dialog = ({ isOpen, onClose, title, children }: DialogProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const Tooltip = ({ content, children, position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  };
  
  return (
    <div className="relative inline-block" 
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`absolute z-50 pointer-events-none whitespace-nowrap px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm transition-opacity duration-300 ${positionClasses[position]}`}
        >
          {content}
          <span className={`absolute w-0 h-0 border-4 border-gray-900 ${arrowClasses[position]}`}></span>
        </div>
      )}
    </div>
  );
};

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
  modelParams
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
  // 添加对话历史状态
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  // 添加显示历史对话的状态
  const [showHistory, setShowHistory] = useState(false);
  // 添加历史详情弹窗状态
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  // 当前查看的消息
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

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

  // 从localStorage加载对话历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    console.log('Loading chat history:', savedHistory); // 添加调试日志
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('Parsed history:', parsedHistory); // 添加调试日志
        setChatHistory(parsedHistory);
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
  }, []);

  // 保存对话历史到localStorage
  useEffect(() => {
    console.log('Saving chat history:', chatHistory); // 添加调试日志
    if (chatHistory.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  const callAi = async () => {
    if (isAiWorking || !prompt.trim()) return;
    setisAiWorking(true);

    // 添加用户消息到历史
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMessage]);

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

              // 添加AI响应到历史
              const aiMessage: ChatMessage = {
                role: 'assistant',
                content: finalDoc,
                timestamp: Date.now()
              };
              setChatHistory(prev => [...prev, aiMessage]);
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

              // 添加AI响应到历史
              const aiMessage: ChatMessage = {
                role: 'assistant',
                content: fixedHtml,
                timestamp: Date.now()
              };
              setChatHistory(prev => [...prev, aiMessage]);
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
      toast.error(error.message || t('errors.optimizationFailed'));
    } finally {
      setisAiWorking(false);
    }
  };

  // 从历史记录加载消息到当前输入
  const loadPromptFromHistory = (message: ChatMessage) => {
    if (message.role === 'user') {
      setPrompt(message.content);
      setShowHistory(false); // 选择后自动关闭历史面板
    }
  };

  // 清除对话历史
  const clearHistory = () => {
    if (window.confirm(t('askAI.confirmClearHistory'))) {
      setChatHistory([]);
      localStorage.removeItem('chatHistory');
      toast.success(t('askAI.historyClearedSuccess'));
    }
  };

  // 格式化时间戳为可读形式
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 查看历史消息详情
  const viewMessageDetail = (message: ChatMessage) => {
    setSelectedMessage(message);
    setShowHistoryDetail(true);
  };

  // 历史按钮点击处理
  const toggleHistory = () => {
    console.log('Toggle history, current state:', showHistory); // 添加调试日志
    console.log('Current chat history:', chatHistory); // 添加调试日志
    setShowHistory(!showHistory);
  };

  return (
    <div
      className={`bg-gray-950 rounded-xl py-2 lg:py-2.5 pl-3.5 lg:pl-4 pr-2 lg:pr-2.5 absolute lg:sticky bottom-3 left-3 lg:bottom-4 lg:left-4 w-[calc(100%-1.5rem)] lg:w-[calc(100%-2rem)] z-10 group ${
        isAiWorking ? "shadow-lg shadow-pink-500/10" : ""
      }`}
    >
      {/* 进度条 */}
      {progress > 0 && (
        <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}></div>
      )}
      
      {/* 历史记录面板 */}
      {showHistory && (
        <div 
          className="fixed bottom-20 left-3 right-3 lg:absolute lg:bottom-[calc(100%+0.5rem)] lg:left-0 lg:right-0 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] lg:max-h-[300px] z-[100] transform transition-all duration-300 ease-out opacity-100 scale-100"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="sticky top-0 p-3 border-b bg-gradient-to-r from-gray-50 to-white backdrop-blur-sm flex items-center justify-between">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              <IoMdTime className="text-indigo-500" />
              {t("askAI.conversationHistory")}
            </span>
            <div className="flex gap-2">
              <button
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                onClick={() => setShowHistory(false)}
              >
                {t("common.close")}
              </button>
              <button
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
                onClick={clearHistory}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {t("askAI.clearHistory")}
              </button>
            </div>
          </div>
          <div className="p-3 max-h-[calc(80vh-4rem)] lg:max-h-[250px] overflow-y-auto custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-center text-sm">{t("askAI.noHistory")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-sm transition-all duration-200 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 cursor-pointer shadow-sm' 
                        : 'bg-gradient-to-r from-gray-50 to-white border border-gray-100'
                    }`}
                    onClick={() => msg.role === 'user' && loadPromptFromHistory(msg)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium flex items-center gap-1.5 ${
                        msg.role === 'user' ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {msg.role === 'user' ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {t("askAI.you")}
                          </>
                        ) : (
                          <>
                            <RiSparkling2Fill className="text-pink-500" />
                            {t("askAI.ai")}
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <div className={`${
                      msg.role === 'user' 
                        ? 'text-gray-700' 
                        : 'text-gray-600'
                    }`}>
                      <p className="break-words leading-relaxed">
                        {msg.role === 'user' 
                          ? msg.content
                          : (msg.content.length > 100 
                              ? `${msg.content.substring(0, 100)}...` 
                              : msg.content)}
                      </p>
                      {msg.content.length > 100 && (
                        <div className="mt-2 flex justify-end">
                          <button 
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors duration-200 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewMessageDetail(msg);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {t("askAI.viewDetail")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 历史详情弹窗 */}
      <Dialog 
        isOpen={showHistoryDetail}
        onClose={() => setShowHistoryDetail(false)}
        title={selectedMessage?.role === 'user' ? t("askAI.yourPrompt") : t("askAI.aiResponse")}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTimestamp(selectedMessage.timestamp)}
              </span>
              {selectedMessage.role === 'assistant' && selectedMessage.content.startsWith("<!DOCTYPE html") && (
                <button 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-md hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-sm cursor-pointer"
                  onClick={() => {
                    setHtml(selectedMessage.content);
                    setView("preview");
                    setShowHistoryDetail(false);
                    setShowHistory(false);
                  }}
                >
                  <MdPreview className="text-lg" />
                  {t("askAI.previewThis")}
                </button>
              )}
            </div>
            
            {selectedMessage.role === 'user' ? (
              <div className="whitespace-pre-wrap p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                <p className="text-gray-700 leading-relaxed">{selectedMessage.content}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-auto border rounded-lg bg-gray-50 custom-scrollbar">
                  {selectedMessage.content.startsWith("<!DOCTYPE html") || 
                   selectedMessage.content.startsWith("<html") ? (
                    <pre className="overflow-x-auto p-4 text-xs font-mono text-gray-700 leading-relaxed">
                      <code>{selectedMessage.content}</code>
                    </pre>
                  ) : (
                    <div className="p-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {selectedMessage.content}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
      
      {defaultHTML !== html && (
        <Tooltip content={t('tabs.preview')} position="top">
          <button
            className="bg-white lg:hidden -translate-y-[calc(100%+8px)] absolute left-0 top-0 shadow-md text-gray-950 text-xs font-medium py-2 px-3 lg:px-4 rounded-lg flex items-center gap-2 border border-gray-100 hover:brightness-150 transition-all duration-100 cursor-pointer"
            onClick={() => setView("preview")}
          >
            <MdPreview />
            {t('tabs.preview')}
          </button>
        </Tooltip>
      )}
      <div className="w-full relative flex items-center h-8">
        <div className="flex items-center gap-2 shrink-0">
          <RiSparkling2Fill className={`text-lg lg:text-xl transition-colors duration-300 ${isAiWorking ? "text-pink-500" : "text-gray-500 group-focus-within:text-pink-500"}`} />
          
          {/* 历史记录按钮 - 更加醒目 */}
          <Tooltip content={t("askAI.history")} position="top">
            <button 
              className={`flex-none flex items-center justify-center rounded-full text-sm font-semibold w-8 h-8 text-center 
              ${showHistory ? "bg-blue-500 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600"} 
              shadow-sm disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer`}
              onClick={toggleHistory}
              disabled={isAiWorking}
              aria-label={t("askAI.history")}
            >
              <IoMdTime className="text-lg" />
            </button>
          </Tooltip>
        </div>
        
        {/* 确保输入框高度固定 */}
        <div className="flex-1 mx-2">
          <input
            type="text"
            disabled={isAiWorking}
            className="w-full bg-transparent text-sm outline-none text-white placeholder:text-gray-500 font-code transition-all duration-300 h-8 leading-8"
            style={{ lineHeight: '2rem' }}
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
        </div>
        
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* 优化提示词按钮 */}
          <Tooltip content={t('askAI.optimizePromptTooltip')} position="top">
            <button
              disabled={isAiWorking || !prompt.trim()}
              className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold w-8 h-8 text-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
              onClick={optimizePrompt}
              aria-label={t('askAI.optimizePrompt')}
            >
              <TbWand className="text-lg" />
            </button>
          </Tooltip>
          <Tooltip content={t('askAI.generate')} position="top">
            <button
              disabled={isAiWorking || !prompt.trim()}
              className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-sm font-semibold w-8 h-8 text-center bg-pink-500 hover:bg-pink-400 text-white shadow-sm dark:shadow-highlight/20 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
              onClick={callAi}
              aria-label={t('askAI.generate')}
            >
              {isAiWorking ? (
                <BiLoaderAlt className="text-lg animate-spin" />
              ) : (
                <GrSend className="-translate-x-[1px]" />
              )}
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export default AskAI;

// 添加自定义滚动条样式
const styles = document.createElement('style');
styles.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
`;
document.head.appendChild(styles);
