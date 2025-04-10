import { create } from 'zustand';

// 定义API环境配置接口
interface EnvConfig {
  apiKey: boolean;
  baseUrl: boolean;
  model: boolean;
}

// 定义模型状态接口
interface ModelState {
  currentModel: string;
  envConfig: EnvConfig;
  isLoading: boolean;
  isLoaded: boolean;
  
  // 操作方法
  setCurrentModel: (model: string) => void;
  setEnvConfig: (config: EnvConfig) => void;
  fetchModelInfo: () => Promise<void>;
}

// 创建模型状态存储
export const useModelStore = create<ModelState>((set, get) => ({
  currentModel: '',
  envConfig: {
    apiKey: false,
    baseUrl: false,
    model: false
  },
  isLoading: false,
  isLoaded: false,
  
  setCurrentModel: (model: string) => set({ currentModel: model }),
  setEnvConfig: (config: EnvConfig) => set({ envConfig: config }),
  
  fetchModelInfo: async () => {
    // 如果已经加载过或正在加载中，则不重复请求
    if (get().isLoaded || get().isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const response = await fetch('/api/check-env');
      const data = await response.json();
      
      if (data.ok) {
        set({ 
          currentModel: data.model || '',
          envConfig: data.env || {
            apiKey: false,
            baseUrl: false,
            model: false
          },
          isLoaded: true
        });
      }
    } catch (error) {
      console.error("Failed to fetch model info:", error);
    } finally {
      set({ isLoading: false });
    }
  }
})); 