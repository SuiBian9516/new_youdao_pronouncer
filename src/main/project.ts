import * as nodePath from "path";
import * as fs from 'fs';
import Utils from "./utils";
import Database from "./database";
import Fetcher from "./fetcher";

export default class Project{
  private name:string;
  private path:string;
  private MANIFEST_PATH:string;
  private DATABASE_PATH:string;
  private CACHE_PATH:string;
  private CACHE_AUDIO_PATH:string;
  private CACHE_VIDEO_PATH:string;
  private CACHE_IMAGE_PATH:string;
  private database:Database;
  // private manifest:ProjectManifest;

  constructor(name:string,path:string){
    this.name = name;
    this.path = path;
    this.MANIFEST_PATH = nodePath.join(this.path,"manifest.json");
    this.DATABASE_PATH = nodePath.join(this.path,"database.json");
    this.CACHE_PATH = nodePath.join(this.path,"cache");
    this.CACHE_AUDIO_PATH = nodePath.join(this.CACHE_PATH,"audios");
    this.CACHE_VIDEO_PATH = nodePath.join(this.CACHE_PATH,"videos");
    this.CACHE_IMAGE_PATH = nodePath.join(this.CACHE_PATH,"images");
    Utils.checkFile(this.DATABASE_PATH,JSON.stringify([],null,2));
    Utils.checkDirectory(this.CACHE_AUDIO_PATH,true);
    Utils.checkDirectory(this.CACHE_IMAGE_PATH,true);
    Utils.checkDirectory(this.CACHE_VIDEO_PATH,true);
    this.database = new Database(JSON.parse(fs.readFileSync(this.DATABASE_PATH,{encoding:"utf-8"})),this.DATABASE_PATH);
    let manifest:ProjectManifest = {
      name:this.name,
      backgroundColor:'#FFFFFF',
      font:''
    }
    Utils.checkFile(this.MANIFEST_PATH,JSON.stringify(manifest,null,2));
    // this.manifest = JSON.parse(fs.readFileSync(this.MANIFEST_PATH,{encoding:"utf-8"}));
  }

  public getDatabase():Database{
    return this.database;
  }

  public getFetcher(appKey:string,secretKey:string,pixabayKey:string):Fetcher{
    return this.database.initFetcher(appKey,secretKey,pixabayKey,this.CACHE_AUDIO_PATH,this.CACHE_IMAGE_PATH);
  }
}

export interface ProjectManifest{
  name:string,
  backgroundColor:string,
  font:string
}