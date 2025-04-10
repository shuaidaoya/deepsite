import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {
  createRepo,
  uploadFiles,
  whoAmI,
  spaceInfo,
  fileExists,
} from "@huggingface/hub";
import bodyParser from "body-parser";

import { PROVIDERS } from "./utils/providers.js";
import { COLORS } from "./utils/colors.js";
import { TEMPLATES, CDN_URLS } from "./utils/templates.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.APP_PORT || 3000;
const MODEL_ID = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const DEFAULT_MAX_TOKENS = process.env.DEFAULT_MAX_TOKENS || 64000;
const DEFAULT_TEMPERATURE = process.env.DEFAULT_TEMPERATURE || 0;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

const getPTag = (repoId) => {
  return `<p style="border-radius: 8px; text-align: center; font-size: 12px; color: #fff; margin-top: 16px;position: fixed; left: 8px; bottom: 8px; z-index: 10; background: rgba(0, 0, 0, 0.8); padding: 4px 8px;">Made with <img src="https://enzostvs-deepsite.hf.space/logo.svg" alt="DeepSite Logo" style="width: 16px; height: 16px; vertical-align: middle;display:inline-block;margin-right:3px;filter:brightness(0) invert(1);"><a href="https://enzostvs-deepsite.hf.space" style="color: #fff;text-decoration: underline;" target="_blank" >DeepSite</a> - <a href="https://enzostvs-deepsite.hf.space?remix=${repoId}" style="color: #fff;text-decoration: underline;" target="_blank" >🧬 Remix</a></p>`;
};

// 获取所有可用模板
app.get("/api/templates", (req, res) => {
  const templates = Object.keys(TEMPLATES).map(key => ({
    id: key,
    name: TEMPLATES[key].name,
    description: TEMPLATES[key].description,
  }));
  
  return res.status(200).send({
    ok: true,
    templates,
  });
});

// 获取指定模板的详细信息
app.get("/api/templates/:id", (req, res) => {
  const { id } = req.params;
  
  if (!TEMPLATES[id]) {
    return res.status(404).send({
      ok: false,
      message: "Template not found",
    });
  }
  
  // 模板中现在直接引用CDN_URLS，不需要替换变量
  const html = TEMPLATES[id].html;
  
  return res.status(200).send({
    ok: true,
    template: {
      id,
      name: TEMPLATES[id].name,
      description: TEMPLATES[id].description,
      systemPrompt: TEMPLATES[id].systemPrompt,
      html: html
    },
  });
});

// 优化提示词的接口
app.post("/api/optimize-prompt", async (req, res) => {
  const { prompt, language } = req.body;
  if (!prompt) {
    return res.status(400).send({
      ok: false,
      message: "Missing prompt field",
    });
  }

  try {
    // OpenAI API 调用
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).send({
        ok: false,
        message: "OpenAI API key is not configured.",
      });
    }

    // 根据语言设置系统提示词
    const systemPrompt = language === 'zh'
      ? "你是一个专业的提示词优化助手。你的任务是改进用户的提示词，使其更加清晰、具体和有效。保持用户的原始意图，但使提示词更加结构化，更容易被AI理解。只输出优化后的提示词文本，不要使用Markdown语法，不要添加任何解释、评论或额外标记。必要时可以使用换行符或空格来格式化文本，使其更易读。"
      : "You are a professional prompt optimization assistant. Your task is to improve the user's prompt to make it clearer, more specific, and more effective. Maintain the user's original intent but make the prompt more structured and easier for AI to understand. Output only the plain text of the optimized prompt without any Markdown syntax, explanations, comments, or additional markers. You may use <br> and spaces to format the text when necessary to improve readability.";

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    };

    console.log("Sending prompt optimization request to OpenAI API");
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, requestOptions);

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      
      try {
        const error = await response.json();
        return res.status(response.status).send({
          ok: false,
          message: error?.message || "Error calling OpenAI API",
        });
      } catch (parseError) {
        return res.status(response.status).send({
          ok: false,
          message: `OpenAI API error: ${response.status} ${response.statusText}`,
        });
      }
    }

    const data = await response.json();
    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).send({
      ok: true,
      optimizedPrompt,
    });
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return res.status(500).send({
      ok: false,
      message: error.message || "An error occurred while optimizing the prompt",
    });
  }
});

app.post("/api/deploy", async (req, res) => {
  const { html, title } = req.body;
  if (!html || !title) {
    return res.status(400).send({
      ok: false,
      message: "Missing required fields",
    });
  }

  return res.status(200).send({
    ok: true,
    message: "Deployment feature has been removed as it required Hugging Face login",
  });
});

app.post("/api/ask-ai", async (req, res) => {
  const { prompt, html, previousPrompt, templateId, language, ui, tools, max_tokens, temperature } = req.body;
  if (!prompt) {
    return res.status(400).send({
      ok: false,
      message: "Missing required fields",
    });
  }

  // 设置响应头
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const selectedProvider = PROVIDERS["openai"];

  try {
    // OpenAI API 调用
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).send({
        ok: false,
        message: "OpenAI API key is not configured.",
      });
    }

    console.log(`Using OpenAI API at: ${OPENAI_BASE_URL}`);
    
    // 获取基础系统提示词
    let systemPrompt = templateId && TEMPLATES[templateId] 
      ? TEMPLATES[templateId].systemPrompt 
      : TEMPLATES.vanilla.systemPrompt;
    
    // 如果有选择组件库，仅当选择Vue3框架时才添加相关提示
    if (ui && ui !== templateId && templateId === 'vue3') {
      const uiTemplate = TEMPLATES[ui];
      if (uiTemplate) {
        // 从组件库提示词中提取关键部分并添加到系统提示中
        systemPrompt += ` Also, use ${uiTemplate.name} component library with CDN: `;
        
        if (ui === 'elementPlus') {
          systemPrompt += `CSS: ${CDN_URLS.ELEMENT_PLUS_CSS}, JS: ${CDN_URLS.ELEMENT_PLUS_JS}, Icons: ${CDN_URLS.ELEMENT_PLUS_ICONS}.`;
        } else if (ui === 'naiveUI') {
          systemPrompt += `${CDN_URLS.NAIVE_UI}.`;
        }
      }
    }
    
    // 如果有选择工具库，添加相关提示
    if (tools && tools.length > 0) {
      systemPrompt += " Include the following additional libraries: ";
      
      tools.forEach((tool, index) => {
        if (tool === 'tailwindcss') {
          systemPrompt += `Tailwind CSS (use <script src="${CDN_URLS.TAILWIND}"></script>)`;
        } else if (tool === 'vueuse') {
          systemPrompt += `VueUse (use <script src="${CDN_URLS.VUEUSE_SHARED}"></script> and <script src="${CDN_URLS.VUEUSE_CORE}"></script>)`;
        } else if (tool === 'dayjs') {
          systemPrompt += `Day.js (use <script src="${CDN_URLS.DAYJS}"></script>)`;
        } else if (tool === 'element-plus-icons') {
          systemPrompt += `Element Plus Icons (use <script src="${CDN_URLS.ELEMENT_PLUS_ICONS}"></script>)`;
        }
        
        if (index < tools.length - 1) {
          systemPrompt += ", ";
        }
      });
      
      systemPrompt += ". Make sure to use the correct syntax for all the frameworks and libraries.";
    }
    
    // 根据语言设置添加注释语言提示
    if (language === 'zh') {
      systemPrompt += " 请使用中文编写所有的注释。";
    } else if (language === 'en') {
      systemPrompt += " Please write all comments in English.";
    }
    
    // 日志输出选择的配置
    console.log("Template configuration:");
    console.log(`- Framework: ${templateId}`);
    console.log(`- UI Library: ${ui || 'None'}`);
    console.log(`- Tools: ${tools ? tools.join(', ') : 'None'}`);
    console.log(`- Language: ${language || 'default'}`);
    
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    if (previousPrompt) {
      messages.push({
        role: "user",
        content: previousPrompt,
      });
    }

    if (html) {
      messages.push({
        role: "assistant",
        content: `The current code is: ${html}.`,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        stream: true,
        max_tokens: max_tokens || parseInt(DEFAULT_MAX_TOKENS),
        temperature: temperature !== undefined ? parseFloat(temperature) : parseFloat(DEFAULT_TEMPERATURE)
      })
    };

    console.log(`Sending request to OpenAI API with model: ${MODEL_ID}`);
    console.log(`Using max_tokens: ${max_tokens || DEFAULT_MAX_TOKENS}, temperature: ${temperature !== undefined ? temperature : DEFAULT_TEMPERATURE}`);
    console.log("Request URL:", `${OPENAI_BASE_URL}/chat/completions`);
    console.log("Request headers:", {
      ...requestOptions.headers,
      "Authorization": "Bearer [API_KEY_HIDDEN]"
    });
    console.log("Request body:", JSON.parse(requestOptions.body));
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, requestOptions);

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      
      try {
        // 检查 Content-Type 是否为 JSON
        const contentType = response.headers.get("Content-Type");
        console.log(`Response Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          console.error("OpenAI API error details:", error);
          return res.status(response.status).send({
            ok: false,
            message: error?.message || "Error calling OpenAI API",
          });
        } else {
          // 如果不是 JSON，直接读取文本
          const errorText = await response.text();
          console.error("OpenAI API error text:", errorText);
          return res.status(response.status).send({
            ok: false,
            message: errorText || `OpenAI API error: ${response.status} ${response.statusText}`,
          });
        }
      } catch (parseError) {
        // 处理 JSON 解析错误
        console.error("Error parsing API response:", parseError);
        return res.status(response.status).send({
          ok: false,
          message: `OpenAI API error: ${response.status} ${response.statusText}`,
        });
      }
    }

    // 处理 OpenAI 流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let completeResponse = "";

    console.log("Starting to process stream response");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream completed");
          break;
        }

        // 检查客户端是否已经断开连接
        if (res.writableEnded) {
          console.log("Client disconnected, stopping stream");
          reader.cancel("Client disconnected");
          break;
        }

        // 解析 SSE 格式的数据
        const chunk = decoder.decode(value);
        
        // 尝试处理不同格式的流式响应
        const lines = chunk.split("\n");
        let processedAnyLine = false;
        
        for (const line of lines) {
          // 标准 OpenAI 格式
          if (line.startsWith("data: ")) {
            processedAnyLine = true;
            if (line.includes("[DONE]")) {
              console.log("Received [DONE] signal");
              continue;
            }
            
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              const content = data.choices?.[0]?.delta?.content || "";
              
              if (content) {
                // 检查连接是否中断
                if (!res.writableEnded) {
                  res.write(content);
                  completeResponse += content;
                  
                  if (completeResponse.includes("</html>")) {
                    console.log("Found </html> tag, ending stream");
                    break;
                  }
                } else {
                  console.log("Cannot write to closed response");
                  break;
                }
              }
            } catch (e) {
              console.error("Error parsing JSON from SSE line:", e);
              console.log("Problematic line:", line);
              // 继续处理其他行
            }
          }
        }
        
        // 如果没有识别出标准 SSE 格式，尝试直接处理整个块
        if (!processedAnyLine && chunk.trim()) {
          try {
            // 尝试作为 JSON 解析整个响应
            const jsonData = JSON.parse(chunk);
            if (jsonData.choices && jsonData.choices[0]) {
              const content = jsonData.choices[0].message?.content || jsonData.choices[0].delta?.content || "";
              if (content && !res.writableEnded) {
                res.write(content);
                completeResponse += content;
              }
            }
          } catch (e) {
            // 不是 JSON，直接作为文本处理
            if (!res.writableEnded) {
              res.write(chunk);
              completeResponse += chunk;
            }
          }
        }
        
        if (completeResponse.includes("</html>")) {
          console.log("Found </html> tag in complete response, ending stream");
          break;
        }
      }
      
      console.log("Stream processing completed");
      if (!res.writableEnded) {
        res.end();
      }
    } catch (streamError) {
      console.error("Error processing stream:", streamError);
      // 检查是否是客户端中断连接
      if (streamError.message && (streamError.message.includes("aborted") || streamError.message.includes("canceled"))) {
        console.log("Client aborted the request");
      }
      
      if (!res.headersSent) {
        res.status(500).send({
          ok: false,
          message: "Error processing response stream"
        });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    if (error.message.includes("exceeded your monthly included credits")) {
      return res.status(402).send({
        ok: false,
        openProModal: true,
        message: error.message,
      });
    }
    if (!res.headersSent) {
      res.status(500).send({
        ok: false,
        message:
          error.message || "An error occurred while processing your request.",
      });
    } else {
      // Otherwise end the stream
      res.end();
    }
  }
});

app.get("/api/remix/:username/:repo", async (req, res) => {
  const { username, repo } = req.params;
  const { hf_token } = req.cookies;

  const token = hf_token || process.env.DEFAULT_HF_TOKEN;

  const repoId = `${username}/${repo}`;
  const space = await spaceInfo({
    name: repoId,
  });

  if (!space || space.sdk !== "static" || space.private) {
    return res.status(404).send({
      ok: false,
      message: "Space not found",
    });
  }

  const url = `https://huggingface.co/spaces/${repoId}/raw/main/index.html`;
  const response = await fetch(url);
  if (!response.ok) {
    return res.status(404).send({
      ok: false,
      message: "Space not found",
    });
  }
  let html = await response.text();
  // remove the last p tag including this url https://enzostvs-deepsite.hf.space
  html = html.replace(getPTag(repoId), "");

  res.status(200).send({
    ok: true,
    html,
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
