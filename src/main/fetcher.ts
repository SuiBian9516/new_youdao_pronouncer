import axios, { AxiosResponse } from 'axios';
import crypto, { randomUUID } from 'crypto';
import * as fs from 'fs';
import Queue from './queue';
import Logger from './logger';
import { join } from 'path';
import Utils from './utils';
import { BrowserWindow } from 'electron';

export default class Fetcher {
  private appKey: string;
  private secretKey: string;
  private pixabayKey: string;
  private readonly audioHost: string = 'https://openapi.youdao.com/ttsapi';
  private readonly imageHost: string = 'https://pixabay.com/api/';
  private audioQueue = new Queue<() => Promise<void>>();
  private imageQueue = new Queue<() => Promise<void>>();

  constructor(appKey: string, secretKey: string, pixabayKey: string) {
    this.appKey = appKey;
    this.secretKey = secretKey;
    this.pixabayKey = pixabayKey;
  }

  private getInput(input: string): string {
    if (!input) return input;
    let inputLen = input.length;
    return inputLen <= 20 ? input : input.slice(0, 10) + inputLen + input.slice(-10);
  }

  private encrypt(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private sign(request: string, timestamp: string, salt: string): string {
    return this.encrypt(this.appKey + this.getInput(request) + salt + timestamp + this.secretKey);
  }

  private createParam(request: string) {
    let salt = randomUUID();
    let curtime = Math.floor(Date.now() / 1000).toString();
    return {
      q: request,
      appKey: this.appKey,
      salt: salt,
      sign: this.sign(request, curtime, salt),
      signType: 'v3',
      curtime: curtime,
      voiceName: 'youxiaoguan',
    };
  }

  public addAudioTask(request: string, path: string) {
    let handler = async () => {
      try {
        if (!Utils.checkFileExistence(path)) {
          let response = await axios.post(
            this.audioHost,
            new URLSearchParams(this.createParam(request)),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              responseType: 'arraybuffer',
            }
          );
          if (response.headers['content-type'].includes('audio')) {
            await fs.promises.writeFile(path, response.data, { flag: 'w' });
            let window = BrowserWindow.getAllWindows()[0];
            window?.webContents.send('progress:fetch', `正在拉取音频：${request}`);
            return;
          } else if (response.headers['content-type'].includes('json')) {
            Logger.getInstance().error(
              'Error when fetching audio: ' + response.data.toString(),
              'fetcher'
            );
          }
        } else {
          return;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          Logger.getInstance().error('Error when fetching audio: ' + error.message, 'fetcher');
        }
        Logger.getInstance().error('Unknown error: ' + error.message, 'fetcher');
      }
    };
    this.audioQueue.enqueue(handler);
  }

  public addImageTask(request: string, path: string) {
    let handler = async () => {
      try {
        if (fs.readdirSync(path).length == 0) {
          let images = await this.searchImage(request, this.pixabayKey, {
            perPage: 3,
            imageType: 'photo',
            safesearch: true,
          });

          if (!images) {
            return;
          }
          for (let i = 0; i < images.length; i++) {
            let response = await axios.get(images[i].webformatURL, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(join(path, `image_${i}.png`), response.data, { flag: 'w' });
            let window = BrowserWindow.getAllWindows()[0];
            window?.webContents.send('progress:fetch', `正在拉取图片(${i + 1})：${request}`);
          }
          return;
        } else {
          return;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          Logger.getInstance().error(
            'Error when fetching image from pixabay: ' + error.message,
            'fetcher'
          );
        }
        Logger.getInstance().error('Unknown error: ' + error.message, 'fetcher');
      }
    };
    this.imageQueue.enqueue(handler);
  }

  public async audioFetch() {
    while (!this.audioQueue.isEmpty()) {
      await this.audioQueue.dequeue()();
    }
  }

  public async imageFetch() {
    while (!this.imageQueue.isEmpty()) {
      await this.imageQueue.dequeue()();
    }
  }

  private async searchImage(
    keyword: string,
    key: string,
    options: {
      perPage?: number;
      imageType?: 'all' | 'photo' | 'vector';
      safesearch?: boolean;
    } = {}
  ): Promise<PixabayImage[] | undefined> {
    const { perPage = 10, imageType = 'photo', safesearch = true } = options;
    try {
      const response: AxiosResponse<PixabayResponse> = await axios.get(this.imageHost, {
        params: {
          key: key,
          q: keyword,
          per_page: perPage,
          image_type: imageType,
          safesearch: safesearch.toString(),
        },
      });

      return response.data.hits.map(img => ({
        id: img.id,
        webformatURL: img.webformatURL,
        tags: img.tags,
        user: img.user,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        Logger.getInstance().error(
          'Error when fetching image from pixabay: ' + error.message,
          'fetcher'
        );
        return undefined;
      }
      Logger.getInstance().error('Unknown error: ' + error.message, 'fetcher');
      return undefined;
    }
  }
}

export interface PixabayImage {
  id: number;
  webformatURL: string;
  tags: string;
  user: string;
}

export interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}
