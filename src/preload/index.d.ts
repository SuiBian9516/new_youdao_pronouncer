import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      errlog(callback:(msg)=>void)
    }
  }
}
