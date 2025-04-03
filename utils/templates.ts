interface Template {
  name: string;
  description: string;
  systemPrompt: string;
  html: string;
}

interface TemplateMap {
  [key: string]: Template;
}

const TEMPLATES: TemplateMap = {
    vanilla: {
      name: "原生HTML",
      description: "仅使用HTML、CSS和JavaScript",
      systemPrompt: "ONLY USE HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src=\"https://cdn.tailwindcss.com\"></script> in the head). Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE",
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>My app</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          height: 100dvh;
          font-family: "Arial", sans-serif;
          text-align: center;
        }
        .arrow {
          position: absolute;
          bottom: 32px;
          left: 0px;
          width: 100px;
          transform: rotate(30deg);
        }
        h1 {
          font-size: 50px;
        }
        h1 span {
          color: #acacac;
          font-size: 32px;
        }
      </style>
    </head>
    <body>
      <h1>
        <span>I'm ready to work,</span><br />
        Ask me anything.
      </h1>
      <img src="https://enzostvs-deepsite.hf.space/arrow.svg" class="arrow" />
      <script></script>
    </body>
  </html>`
    },
    vue3: {
      name: "Vue 3",
      description: "Vue 3 框架",
      systemPrompt: "ONLY USE VUE 3 WITH HTML, CSS AND JAVASCRIPT. Create a Vue 3 application using the CDN version (https://unpkg.com/vue@3/dist/vue.global.js). Structure your code with Vue 3 components, reactivity, and proper Vue syntax. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src=\"https://cdn.tailwindcss.com\"></script> in the head). Also, try to elaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE",
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>Vue 3 App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        [v-cloak] {
          display: none;
        }
      </style>
    </head>
    <body>
      <div id="app" v-cloak>
        <div class="min-h-screen flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-5xl font-bold mb-2">
              <span class="text-3xl text-gray-400 block">{{ welcomeMessage }}</span>
              {{ mainMessage }}
            </h1>
            <img src="https://enzostvs-deepsite.hf.space/arrow.svg" class="w-24 absolute bottom-8 left-0 transform rotate-30" />
          </div>
        </div>
      </div>
  
      <script>
        const { createApp, ref } = Vue;
        
        createApp({
          setup() {
            const welcomeMessage = ref('I\\'m ready to work,');
            const mainMessage = ref('Ask me anything.');
            
            return {
              welcomeMessage,
              mainMessage
            };
          }
        }).mount('#app');
      </script>
    </body>
  </html>`
    },
    elementPlus: {
      name: "Vue 3 + Element Plus",
      description: "Vue 3 框架配合 Element Plus 组件库",
      systemPrompt: "CREATE A VUE 3 APPLICATION WITH ELEMENT PLUS UI LIBRARY. Use Vue 3 CDN (https://unpkg.com/vue@3/dist/vue.global.js) and Element Plus CDN (CSS: https://unpkg.com/element-plus/dist/index.css, JS: http://unpkg.com/element-plus). Structure your code with Vue 3 components, reactivity, Element Plus components, and proper Vue syntax. Follow Element Plus documentation for component usage. Try to elaborate as much as you can, to create something unique and visually appealing. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE",
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>Vue 3 + Element Plus App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
      <script src="http://unpkg.com/element-plus"></script>
      <style>
        [v-cloak] {
          display: none;
        }
        body {
          margin: 0;
          font-family: var(--el-font-family);
        }
      </style>
    </head>
    <body>
      <div id="app" v-cloak>
        <el-config-provider>
          <div class="min-h-screen flex items-center justify-center p-4">
            <el-card shadow="hover" class="max-w-md w-full">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3>欢迎</h3>
                  <el-button type="primary">开始</el-button>
                </div>
              </template>
              <div class="text-center py-6">
                <el-alert
                  title="准备就绪"
                  type="success"
                  :closable="false"
                  class="mb-4"
                />
                <h2 class="text-xl mb-4">我可以帮您创建任何网页</h2>
                <el-input
                  v-model="userPrompt"
                  placeholder="请输入您的需求..."
                  class="mb-4"
                />
                <el-button type="primary" @click="generateContent">
                  生成内容
                </el-button>
              </div>
            </el-card>
          </div>
        </el-config-provider>
      </div>
  
      <script>
        const { createApp, ref } = Vue;
        
        const App = {
          setup() {
            const userPrompt = ref('');
            
            const generateContent = () => {
              alert('您输入的需求是: ' + userPrompt.value);
              // 这里将调用AI生成内容
            };
            
            return {
              userPrompt,
              generateContent
            };
          }
        };
        
        const app = createApp(App);
        app.use(ElementPlus);
        app.mount('#app');
      </script>
    </body>
  </html>`
    },
    naiveUI: {
      name: "Vue 3 + Naive UI",
      description: "Vue 3 框架配合 Naive UI 组件库",
      systemPrompt: "CREATE A VUE 3 APPLICATION WITH NAIVE UI LIBRARY. Use Vue 3 CDN (https://unpkg.com/vue@3/dist/vue.global.js) and Naive UI CDN (https://unpkg.com/naive-ui). Structure your code with Vue 3 components, reactivity, Naive UI components, and proper Vue syntax. Follow Naive UI documentation for component usage. Try to elaborate as much as you can, to create something unique and visually appealing. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE",
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>Vue 3 + Naive UI App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
      <script src="https://unpkg.com/naive-ui"></script>
      <style>
        [v-cloak] {
          display: none;
        }
        body {
          margin: 0;
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div id="app" v-cloak>
        <n-config-provider>
          <n-layout>
            <n-layout-header bordered style="padding: 16px">
              <n-space justify="space-between">
                <n-h3>DeepSite 助手</n-h3>
                <n-button type="primary">开始</n-button>
              </n-space>
            </n-layout-header>
            <n-layout-content style="padding: 24px">
              <div style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 140px)">
                <n-card style="max-width: 600px; width: 100%">
                  <n-space vertical>
                    <n-alert type="success" title="准备就绪" style="margin-bottom: 16px" />
                    <n-h2 style="text-align: center">我可以帮您创建任何网页</n-h2>
                    <n-input v-model:value="userPrompt" type="textarea" placeholder="请输入您的需求..." />
                    <div style="text-align: center; margin-top: 16px">
                      <n-button type="primary" @click="generateContent">生成内容</n-button>
                    </div>
                  </n-space>
                </n-card>
              </div>
            </n-layout-content>
          </n-layout>
        </n-config-provider>
      </div>
  
      <script>
        const { createApp, ref } = Vue;
        
        const App = {
          setup() {
            const userPrompt = ref('');
            
            const generateContent = () => {
              window.$message.info('您输入的需求是: ' + userPrompt.value);
              // 这里将调用AI生成内容
            };
            
            return {
              userPrompt,
              generateContent
            };
          }
        };
        
        const app = createApp(App);
        app.use(naive);
        app.mount('#app');
      </script>
    </body>
  </html>`
    }
  };
  
  export { TEMPLATES };