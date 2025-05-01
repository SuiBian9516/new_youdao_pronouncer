import * as nodePath from 'path';
import * as fs from 'fs';
import Utils from './utils';
import Database from './database';
import Generator from './generator';
import Logger from './logger';

export default class Project {
  private name: string;
  private path: string;
  private MANIFEST_PATH: string;
  private DATABASE_PATH: string;
  private CACHE_PATH: string;
  private CACHE_AUDIO_PATH: string;
  private CACHE_VIDEO_PATH: string;
  private CACHE_IMAGE_PATH: string;
  private database: Database;
  private manifest: ProjectManifest;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
    this.MANIFEST_PATH = nodePath.join(this.path, 'manifest.json');
    this.DATABASE_PATH = nodePath.join(this.path, 'database.json');
    this.CACHE_PATH = nodePath.join(this.path, 'cache');
    this.CACHE_AUDIO_PATH = nodePath.join(this.CACHE_PATH, 'audios');
    this.CACHE_VIDEO_PATH = nodePath.join(this.CACHE_PATH, 'videos');
    this.CACHE_IMAGE_PATH = nodePath.join(this.CACHE_PATH, 'images');
    Utils.checkFile(this.DATABASE_PATH, JSON.stringify([], null, 2));
    Utils.checkDirectory(this.CACHE_AUDIO_PATH, true);
    Utils.checkDirectory(this.CACHE_IMAGE_PATH, true);
    Utils.checkDirectory(this.CACHE_VIDEO_PATH, true);
    this.database = new Database(
      JSON.parse(fs.readFileSync(this.DATABASE_PATH, { encoding: 'utf-8' })),
      this.DATABASE_PATH
    );
    let manifest: ProjectManifest = {
      name: this.name,
      backgroundColor: '#000000',
      characterColor: ['#FFFFFF', '#E0C410'],
      title: '',
      subtitle: '',
    };
    Utils.checkFile(this.MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    this.manifest = JSON.parse(fs.readFileSync(this.MANIFEST_PATH, { encoding: 'utf-8' }));
  }

  public getDatabase(): Database {
    return this.database;
  }

  public async generateVideo(dest: string) {
    let generator = new Generator(this.manifest.backgroundColor, this.manifest.characterColor);
    await generator.generateVideos(
      this.manifest.title,
      this.manifest.subtitle,
      this.CACHE_VIDEO_PATH,
      this.database.getItems(),
      dest
    );
  }

  public getName(): string {
    return this.name;
  }

  public getPath(): string {
    return this.path;
  }

  public getManifest(): ProjectManifest {
    return this.manifest;
  }

  public updateManifest(newManifest: ProjectManifest): boolean {
    try {
      newManifest.name = this.name;

      this.manifest = newManifest;

      fs.writeFileSync(this.MANIFEST_PATH, JSON.stringify(this.manifest, null, 2), {
        encoding: 'utf-8',
      });

      return true;
    } catch (error) {
      console.error('Fail to update manifest:', error);
      return false;
    }
  }

  public getAudioCachePath(): string {
    return this.CACHE_AUDIO_PATH;
  }

  public getImageCachePath(): string {
    return this.CACHE_IMAGE_PATH;
  }

  public clearCache() {
    fs.rmSync(this.CACHE_VIDEO_PATH, { recursive: true, force: true });
    fs.rmSync(this.CACHE_AUDIO_PATH, { recursive: true, force: true });
    fs.rmSync(this.CACHE_IMAGE_PATH, { recursive: true, force: true });
    this.getDatabase().clearAllPath();
    Logger.getInstance().info('Cache has been cleared', 'project');
    fs.mkdirSync(this.CACHE_VIDEO_PATH, { recursive: true });
    fs.mkdirSync(this.CACHE_AUDIO_PATH, { recursive: true });
    fs.mkdirSync(this.CACHE_IMAGE_PATH, { recursive: true });
  }
}

export interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}
