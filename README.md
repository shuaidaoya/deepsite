# DeepSite

> 本项目是由 [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite) 魔改而来。

DeepSite 是一个基于 DeepSeek 大语言模型的应用程序生成工具，允许用户通过简单的描述快速生成各种 Web 应用程序。项目使用现代 Web 技术栈构建，包括 React、TypeScript、Vite 和 Express 等。

## 功能特点

- 基于自然语言描述生成完整的 Web 应用程序
- 内置代码编辑器，支持实时预览和编辑
- 多语言支持
- 响应式设计，适配各种设备

## 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn 包管理器
- Docker 和 Docker Compose (用于容器化部署)

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
```

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将运行在 http://localhost:5173

### 构建项目

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
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