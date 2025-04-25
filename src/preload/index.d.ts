import { ElectronAPI } from '@electron-toolkit/preload'

interface ProjectInfo {
  name: string;
  path: string;
  lastModifiedTime: string;
}

interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}

interface Item {
  id: string;
  name: string;
  example: string;
  description: [string, string];
  image: string;
  audio: [string, string];
  count: number;
}

interface API {
  fetchBingWallpaper: () => Promise<{ success: boolean; imageUrl?: string; error?: string }>,
  getConfig: () => Promise<{youdao:{appKey:string,key:string},pixabay:{key:string},deepseek:{apiKey:string}}>,
  saveConfig: (config: {youdao:{appKey:string,key:string},pixabay:{key:string},deepseek:{apiKey:string}}) => Promise<boolean>,
  getProjects: () => Promise<ProjectInfo[]>,
  openProject: (projectName: string) => Promise<{ success: boolean; message?: string }>,
  deleteProject: (projectName: string) => Promise<{ success: boolean; message?: string }>,
  newProject: (projectName: string) => Promise<{ success: boolean; message?: string }>,
  getProjectManifest: (projectName: string) => Promise<{ success: boolean; manifest?: ProjectManifest; message?: string }>,
  updateProjectManifest: (projectName: string, manifest: ProjectManifest) => Promise<{ success: boolean; message?: string }>,
  selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>,
  createProject: (projectInfo: { name: string; path: string }) => Promise<{ success: boolean; message?: string }>,
  getDefaultProjectPath: () => Promise<string>,
  getAllItem: () => Promise<{ success: boolean; items: Item[]; message?: string }>,
  addItem: (item: { name: string; example: string; description: [string, string]; count: number }) => 
    Promise<{ success: boolean; message?: string }>,
  updateItem: (item: Item) => Promise<{ success: boolean; message?: string }>,
  deleteItem: (itemName: string) => Promise<{ success: boolean; message?: string }>,
  saveItemsOrder: (items: Item[]) => Promise<{ success: boolean; message?: string }>,
  generateVideo: (projectName: string, outputPath?: string) => Promise<{ success: boolean; filePath?: string; message?: string }>,
  showItemInFolder: (path:string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
