import * as fs from 'fs';

export default class Utils {
  static checkDirectory(path: string, autoCreate: boolean) {
    if (fs.existsSync(path)) {
      return;
    } else {
      if (autoCreate) fs.mkdirSync(path, { recursive: true });
    }
  }

  static checkFile(path: string, defaultContent: string) {
    if (fs.existsSync(path)) {
      return;
    } else {
      fs.writeFileSync(path, defaultContent);
    }
  }

  static getTimeString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  static getShortTimeString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static checkFileExistence(path: string): boolean {
    return fs.existsSync(path);
  }

  static generateRandomString(length: number, list: string[]): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    if (result in list) {
      return this.generateRandomString(length, list);
    } else {
      return result;
    }
  }

  public static trimString(str: string, start: number, end: number) {
    return str.slice(start, str.length - end);
  }
}
