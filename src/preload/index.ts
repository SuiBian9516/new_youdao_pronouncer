import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

declare global {
  interface Window {
    electron: typeof electronAPI;
    api: typeof api;
  }
}

const api = {
  fetchBingWallpaper: async () => {
    return await ipcRenderer.invoke('fetch-bing-wallpaper');
  },
  getConfig: async () => {
    return await ipcRenderer.invoke('setting:get');
  },
  saveConfig: async config => {
    return await ipcRenderer.invoke('setting:save', config);
  },
  getProjects: async () => {
    return await ipcRenderer.invoke('project:get-all');
  },
  openProject: async (projectName: string) => {
    return await ipcRenderer.invoke('project:open', projectName);
  },
  deleteProject: async (projectName: string) => {
    return await ipcRenderer.invoke('project:delete', projectName);
  },
  newProject: async (projectName: string) => {
    return await ipcRenderer.invoke('project:new', projectName);
  },
  getProjectManifest: async (projectName: string) => {
    return await ipcRenderer.invoke('project:get-manifest', projectName);
  },
  updateProjectManifest: async (projectName: string, manifest: any) => {
    return await ipcRenderer.invoke('project:update-manifest', projectName, manifest);
  },
  selectFolder: async () => {
    return await ipcRenderer.invoke('dialog:select-folder');
  },
  createProject: async (projectInfo: { name: string; path: string; manifest }) => {
    return await ipcRenderer.invoke('project:create', projectInfo);
  },
  getDefaultProjectPath: async () => {
    return await ipcRenderer.invoke('get:default-project-path');
  },
  getAllItem: async () => {
    return await ipcRenderer.invoke('database:get-all');
  },
  addItem: async item => {
    return await ipcRenderer.invoke('database:add-item', item);
  },
  updateItem: async item => {
    return await ipcRenderer.invoke('database:update-item', item);
  },
  deleteItem: async itemName => {
    return await ipcRenderer.invoke('database:delete-item', itemName);
  },
  saveItemsOrder: async items => {
    return await ipcRenderer.invoke('database:save-order', items);
  },
  generateVideo: async (projectName, outputPath) => {
    return await ipcRenderer.invoke('project:generate-video', projectName, outputPath);
  },
  showItemInFolder: async path => {
    return await ipcRenderer.invoke('dialog:show-item-in-folder', path);
  },
  getAudioPath: async itemName => {
    return await ipcRenderer.invoke('database:get-audio-path', itemName);
  },
  getImagePath: async itemName => {
    return await ipcRenderer.invoke('database:get-image-path', itemName);
  },
  getFileBase64: async filePath => {
    return await ipcRenderer.invoke('file:get-base64', filePath);
  },
  setItemAudio: async (itemName, audioPath, isExample) => {
    return await ipcRenderer.invoke('database:set-audio', itemName, audioPath, isExample);
  },
  setItemImage: async (itemName, imagePath) => {
    return await ipcRenderer.invoke('database:set-image', itemName, imagePath);
  },
  setDefaultImage: async (itemName, imagePath) => {
    return await ipcRenderer.invoke('database:set-default-image', itemName, imagePath);
  },
  selectAudioFile: async () => {
    return await ipcRenderer.invoke('dialog:select-audio');
  },
  selectImageFile: async () => {
    return await ipcRenderer.invoke('dialog:select-image');
  },
  clearProjectCache: async (projectName: string) => {
    return await ipcRenderer.invoke('project:clear-cache', projectName);
  },
  importDataByAI: async (data: string) => {
    return await ipcRenderer.invoke('ai:import-data', data);
  },
  buildExampleByAI: async (item: string, explanation: string) => {
    return await ipcRenderer.invoke('ai:build-sentence', item, explanation);
  },
  onFetchingProgress: async callback => {
    ipcRenderer.on('progress:fetch', async (_, message) => {
      await callback(message);
    });
  },
  onGeneratingProgress: async callback => {
    ipcRenderer.on('progress:generate', async (_, message) => {
      await callback(message);
    });
  },
  fetchAllData: async () => {
    return await ipcRenderer.invoke('database:fetch-all');
  },
  getMetadata: async () => {
    return await ipcRenderer.invoke('get-metadata');
  },
  exportDatabaseFile: async () => {
    return await ipcRenderer.invoke('database:export');
  },
  importDatabaseFile: async () => {
    return await ipcRenderer.invoke('database:import');
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;

  window.api = api;
}
