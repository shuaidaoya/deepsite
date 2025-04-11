# DeepSite

[English](./README.en.md) | 中文

> 本项目是由 [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite) 魔改而来。

DeepSite 是一个可以基于各类大语言模型的应用程序生成工具，允许用户通过简单的描述快速生成各种 Web 应用程序。项目使用现代 Web 技术栈构建，包括 React、TypeScript、Vite 和 Express 等。

## 功能特点

- 基于自然语言描述生成完整的 Web 应用程序
- 内置Vue、及各类组件、工具库生成模版
- 内置代码编辑器，支持实时预览和编辑
- 中英文支持
- 响应式设计，适配各种设备

## 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn 包管理器
- Docker 和 Docker Compose (用于容器化部署)

## Vercel 部署

你可以使用以下按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?https://github.com/kiritoko1029/deepsite)

### 配置 Vercel 环境变量

在 Vercel 部署过程中，需要配置以下环境变量：
> 符合Open AI请求和响应格式的API提供商均可，若不在环境变量中配置，则需要在页面的设置中配置。

| 环境变量 | 描述 | 示例 |
|---------|------|------|
| OPENAI_API_KEY | OpenAI 或 DeepSeek API 密钥 | sk-xxxxxxxxxxxxxxxx |
| OPENAI_MODEL | 使用的模型名称 | deepseek-chat/DeepSeek-V3-0324 或 gpt-4o |
| OPENAI_BASE_URL | API 基础 URL | https://api.deepseek.com/v1 或 https://api.openai.com/v1 |
| IP_RATE_LIMIT | 每个IP每小时最大请求次数 | 100 |

> 注意：如果 IP_RATE_LIMIT 未设置或设为小于等于0的值，则不会启用IP访问限制。

注意：在 Vercel 部署中，由于免费版的Vercel设置的默认超时时间是10s，你需要在项目的**Setting**中配置**Function Max Duration**，免费版最大可以设置为60s。

### 构建命令

在 Vercel 项目设置中，确保设置了正确的构建命令：

- **构建命令**: `npm run build`
- **输出目录**: `dist`

## 本地开发

### 环境准备

1. 克隆仓库到本地：

```bash
git clone https://github.com/yourusername/deepsite.git
cd deepsite
```

2. 创建环境变量文件：

```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，填入必要的 API 密钥和配置：

```
APP_PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1
IP_RATE_LIMIT=100  # 每IP每小时最大请求数，设为0或不设置则不限制
```

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run start:dev
```

开发服务器将运行在 http://localhost:5173

### 生产模式运行,构建完前端再启动后端服务
```bash
npm run build && npm run start
```
生产服务器默认运行在 http://localhost:3000，端口可通过 `.env` 文件中的 `APP_PORT` 变量配置。

## Docker 部署

### 使用 Docker Compose
> docker镜像已发布,`docker pull 195658/deepsite:latest`

1. 确保已安装 Docker 和 Docker Compose
2. 编辑 `docker-compose.yml` 文件，设置必要的环境变量：

```yaml
version: '3.8'

services:
  web:
    image: 195658/deepsite:latest
    ports:
      - "30002:3000"
    environment:
      - OPENAI_API_KEY=your_openai_api_key_here
      - OPENAI_MODEL=gpt-4o
      - OPENAI_BASE_URL=https://api.openai.com/v1
      - APP_PORT=3000
      - IP_RATE_LIMIT=100  # 每IP每小时最大请求数，设为0则不限制
    restart: unless-stopped
```

3. 构建并启动容器：

```bash
docker-compose up -d
```

应用将在 http://localhost:30002 上运行。

### 使用 Docker 直接构建

1. 构建 Docker 镜像：

```bash
docker build -t deepsite .
```

2. 运行容器：

```bash
docker run -d -p 30002:3000 --name deepsite \
  -e OPENAI_API_KEY=your_openai_api_key_here \
  -e OPENAI_MODEL=gpt-4o \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  -e APP_PORT=3000 \
  -e IP_RATE_LIMIT=100 \
  deepsite
```

## Hugging Face Spaces 部署

本项目已配置为可在 Hugging Face Spaces 上部署。配置详情请查阅：
https://huggingface.co/docs/hub/spaces-config-reference

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进本项目。在提交代码前，请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档

## 许可证

MIT