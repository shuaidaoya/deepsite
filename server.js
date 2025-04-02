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

// Load environment variables from .env file
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.APP_PORT || 3000;
const MODEL_ID = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

const getPTag = (repoId) => {
  return `<p style="border-radius: 8px; text-align: center; font-size: 12px; color: #fff; margin-top: 16px;position: fixed; left: 8px; bottom: 8px; z-index: 10; background: rgba(0, 0, 0, 0.8); padding: 4px 8px;">Made with <img src="https://enzostvs-deepsite.hf.space/logo.svg" alt="DeepSite Logo" style="width: 16px; height: 16px; vertical-align: middle;display:inline-block;margin-right:3px;filter:brightness(0) invert(1);"><a href="https://enzostvs-deepsite.hf.space" style="color: #fff;text-decoration: underline;" target="_blank" >DeepSite</a> - <a href="https://enzostvs-deepsite.hf.space?remix=${repoId}" style="color: #fff;text-decoration: underline;" target="_blank" >🧬 Remix</a></p>`;
};

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
  const { prompt, html, previousPrompt } = req.body;
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

  let TOKENS_USED = prompt?.length;
  if (previousPrompt) TOKENS_USED += previousPrompt.length;
  if (html) TOKENS_USED += html.length;

  const selectedProvider = PROVIDERS["openai"];

  if (TOKENS_USED >= selectedProvider.max_tokens) {
    return res.status(400).send({
      ok: false,
      message: `Context is too long. ${selectedProvider.name} allows ${selectedProvider.max_tokens} max tokens.`,
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

    console.log(`Using OpenAI API at: ${OPENAI_BASE_URL}`);
    
    const messages = [
      {
        role: "system",
        content: `ONLY USE HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="https://cdn.tailwindcss.com"></script> in the head). Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
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

    const actualMaxTokens = Math.min(selectedProvider.max_tokens, 16000);
    console.log(`Using max_tokens: ${actualMaxTokens}`);
    
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
        // 确保 max_tokens 不超过 API 的限制
        max_tokens: actualMaxTokens
      })
    };

    console.log(`Sending request to OpenAI API with model: ${MODEL_ID}`);
    // 打印完整请求配置（隐藏敏感信息）
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
            message: error.error?.message || "Error calling OpenAI API",
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
                res.write(content);
                completeResponse += content;
                
                if (completeResponse.includes("</html>")) {
                  console.log("Found </html> tag, ending stream");
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
              if (content) {
                res.write(content);
                completeResponse += content;
              }
            }
          } catch (e) {
            // 不是 JSON，直接作为文本处理
            res.write(chunk);
            completeResponse += chunk;
          }
        }
        
        if (completeResponse.includes("</html>")) {
          console.log("Found </html> tag in complete response, ending stream");
          break;
        }
      }
      
      console.log("Stream processing completed");
      res.end();
    } catch (streamError) {
      console.error("Error processing stream:", streamError);
      if (!res.headersSent) {
        res.status(500).send({
          ok: false,
          message: "Error processing response stream"
        });
      } else {
        res.end();
      }
    }
  } catch (error) {
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

  console.log(space);

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
