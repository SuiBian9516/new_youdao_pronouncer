import { dirname, join } from 'path';
import Fetcher from './fetcher';
import Logger from './logger';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import Utils from './utils';

export default class Database {
  private raw: { [key: string]: Item } = {};
  private path: string;
  private id: string[] = [];

  constructor(raw: Item[], path: string) {
    this.path = path;
    for (let i = 0; i < raw.length; i++) {
      this.raw[raw[i].name] = raw[i];
      this.id.push(raw[i].id);
    }
  }

  public getItem(name: string): Item {
    return this.raw[name];
  }

  public addItem(
    name: string,
    example: string,
    description: [string, string],
    count: number,
    autoSave: boolean = true
  ) {
    if (name in Object.keys(this.raw)) {
      return;
    }
    let id = Utils.generateRandomString(5, this.id);
    this.raw[name] = {
      id: id,
      name,
      example,
      description,
      count,
      audio: ['', ''],
      image: '',
    };
    this.id.push(id);
    if (autoSave) this.save();
  }

  public deleteItem(name: string) {
    delete this.id[this.raw[name].id];
    delete this.raw[name];
  }

  public setItemAudio(name: string, p: [string, string]) {
    this.raw[name].audio = p;
    this.save();
  }

  public setItemImage(name: string, p: string) {
    this.raw[name].image = p;
    this.save();
  }

  public setItemExample(name: string, data: [string, string]) {
    this.raw[name].example = data[0];
    this.raw[name].description[1] = data[1];
    this.save();
  }

  public getFetcher(
    appKey: string,
    secretKey: string,
    pixabayKey: string,
    audio: string,
    image: string
  ): Fetcher {
    let vals = Object.values(this.raw);
    let fetcher = new Fetcher(appKey, secretKey, pixabayKey);
    for (let i = 0; i < vals.length; i++) {
      fetcher.addAudioTask(vals[i].name, join(audio, `${vals[i].id}_item.mp3`));
      if (vals[i].example != '') {
        fetcher.addAudioTask(vals[i].example, join(audio, `${vals[i].id}_example.mp3`));
      }
      mkdirSync(join(image, `i_${vals[i].id}`), { recursive: true });
      fetcher.addImageTask(vals[i].name, join(image, `i_${vals[i].id}`));
      this.setItemAudio(vals[i].name, [
        join(audio, `${vals[i].id}_item.mp3`),
        vals[i].example != '' ? join(audio, `${vals[i].id}_example.mp3`) : '',
      ]);
      if (vals[i].image == '')
        this.setItemImage(vals[i].name, join(image, `i_${vals[i].id}`, 'image_0.png'));
    }
    this.save();
    return fetcher;
  }

  public getItems(): Item[] {
    return Object.values(this.raw);
  }

  public saveOrder(items: Item[]) {
    this.id = [];

    const newRaw: { [key: string]: Item } = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      newRaw[item.name] = item;
      this.id.push(item.id);
    }

    this.raw = newRaw;

    writeFileSync(this.path, JSON.stringify(items, null, 2));
    Logger.getInstance().debug('Database ordered items saved', 'database');

    return true;
  }

  public updateItem(name: string, example: string, description: [string, string], count: number) {
    if (this.raw[name]) {
      this.raw[name].example = example;
      this.raw[name].description = description;
      this.raw[name].count = count;
      this.save();
    } else {
      Logger.getInstance().warn(`Fail to update item: No such item: ${name}`, 'database');
    }
  }

  public getAudioPath(name: string): [string, string] {
    return this.raw[name].audio;
  }

  public getImagePath(name: string): string[] {
    return readdirSync(dirname(this.raw[name].image));
  }

  public save() {
    writeFileSync(this.path, JSON.stringify(Object.values(this.raw), null, 2));
    Logger.getInstance().debug('Database file saved', 'database');
  }

  public clearAllPath() {
    for (let k of Object.keys(this.raw)) {
      this.raw[k].audio = ['', ''];
      this.raw[k].image = '';
    }
    this.save();
  }

  public exportDatabaseFile(path: string) {
    let newData = [];
    for (let v of Object.values(this.raw)) {
      newData.push({
        name: v.name,
        description: v.description,
        example: v.example,
        count: v.count,
      });
    }
    writeFileSync(path, JSON.stringify(newData, null, 2), { flag: 'w' });
  }

  public importDatabaseFile(path: string) {
    try {
      let raw = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));
      let keys = Object.keys(this.raw);
      for (let v of raw) {
        if (v.name in keys) {
          continue;
        } else {
          this.addItem(v.name, v.example, v.description, v.count, false);
        }
      }
      this.save();
    } catch (e) {
      Logger.getInstance().error(`Fail to import data from ${path}: ${e}`, 'database');
    }
  }
}

export interface Item {
  id: string;
  name: string;
  example: string;
  description: [string, string];
  image: string;
  audio: [string, string];
  count: number;
}
