declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

interface Window {
  electron: any;
  api: {
    fetchBingWallpaper: () => Promise<{
      success: boolean;
      imageUrl?: string;
      error?: string;
    }>;
    getConfig: () => Promise<{
      youdao: {
        appKey: string;
        key: string;
      };
      pixabay: {
        key: string;
      };
      deepseek: {
        apiKey: string;
      };
      preference: { fetchWhenAddItem: boolean };
    }>;
    saveConfig: (config: any) => Promise<boolean>;
    getProjects: () => Promise<any[]>;
    openProject: (projectName: string) => Promise<{
      success: boolean;
      project?: { name: string; path: string };
      message?: string;
    }>;
    deleteProject: (projectName: string) => Promise<{
      success: boolean;
      message: string;
    }>;
    newProject: (projectName: string) => Promise<{
      success: boolean;
      message: string;
    }>;
    getProjectManifest: (projectName: string) => Promise<{
      success: boolean;
      manifest?: any;
      message?: string;
    }>;
    updateProjectManifest: (
      projectName: string,
      manifest: any
    ) => Promise<{
      success: boolean;
      message: string;
    }>;
    selectFolder: () => Promise<{
      canceled: boolean;
      filePaths: string[];
    }>;
    createProject: (projectInfo: {
      name: string;
      path: string;
      manifest: ProjectManifest;
    }) => Promise<{
      success: boolean;
      message: string;
    }>;
    getDefaultProjectPath: () => Promise<string>;
    getAllItem: () => Promise<{
      success: boolean;
      items: any[];
      message?: string;
    }>;
    addItem: (item: any) => Promise<{
      success: boolean;
      message: string;
    }>;
    updateItem: (item: any) => Promise<{
      success: boolean;
      message: string;
    }>;
    deleteItem: (itemName: string) => Promise<{
      success: boolean;
      message: string;
    }>;
    saveItemsOrder: (items: any[]) => Promise<{
      success: boolean;
      message: string;
    }>;
    generateVideo: (
      projectName: string,
      outputPath?: string
    ) => Promise<{
      success: boolean;
      filePath?: string;
      message: string;
    }>;
    showItemInFolder: (path: string) => Promise<void>;
    getAudioPath: (itemName: string) => Promise<{
      success: boolean;
      paths?: [string, string];
      message?: string;
    }>;
    getImagePath: (itemName: string) => Promise<{
      success: boolean;
      paths?: string[];
      message?: string;
    }>;
    getFileBase64: (filePath: string) => Promise<{
      success: boolean;
      base64?: string;
      message?: string;
    }>;
    setItemAudio: (
      itemName: string,
      audioPath: string,
      isExample: boolean
    ) => Promise<{
      success: boolean;
      message: string;
      path?: string;
    }>;
    setItemImage: (
      itemName: string,
      imagePath: string
    ) => Promise<{
      success: boolean;
      message: string;
      path?: string;
      isDefault?: boolean;
    }>;
    selectAudioFile: () => Promise<{
      canceled: boolean;
      filePaths: string[];
    }>;
    selectImageFile: () => Promise<{
      canceled: boolean;
      filePaths: string[];
    }>;
    setDefaultImage: (
      itemName: string,
      imagePath: string
    ) => Promise<{
      success: boolean;
      message: string;
    }>;
    clearProjectCache: (projectName: string) => Promise<{
      success: boolean;
      message: string;
    }>;
    importDataByAI: (data: string) => Promise<{ success: boolean; message: string }>;
    buildExampleByAI: (
      item: string,
      explanation: string
    ) => Promise<{ success: boolean; message: string; data: [string, string] }>;
    fetchAllData: () => Promise<{ success: boolean; message: string }>;
    onFetchingProgress: (callback: (message: string) => Promise<void>) => Promise<void>;
    onGeneratingProgress: (callback: (message: string) => Promise<void>) => Promise<void>;
    getMetadata: () => Promise<{ version: string; authors: string[] }>;
    exportDatabaseFile: () => Promise<{ success: boolean; message: string }>;
    importDatabaseFile: () => Promise<{ success: boolean; message: string }>;
  };
}

interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}
