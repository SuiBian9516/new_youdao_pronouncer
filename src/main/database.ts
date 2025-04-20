import { join } from "path";
import Fetcher from "./fetcher";
import Logger from "./logger";
import { mkdirSync, writeFileSync } from "fs";

export default class Database{
  private raw:DatabaseType;
  private path:string;

  constructor(raw:DatabaseType,path:string){
    this.raw = raw;
    this.path = path;
  }

  public getItem(name:string):Item{
    return this.raw[name];
  }

  public addItem(name:string,example:string,description:[string,string],count){
    this.raw[name] = {
      name,
      example,
      description,
      count,
      audio:['',''],
      image:''
    };
  }

  public deleteItem(name:string){
    delete this.raw[name];
  }

  public setItemAudio(name:string,p:[string,string]){
    this.raw[name].audio = p;
  }

  public setItemImage(name:string,p:string){
    this.raw[name].image = p;
  }

  public initFetcher(appKey:string,secretKey:string,pixabayKey:string,audio:string,image:string):Fetcher{
    let vals = Object.values(this.raw);
    let fetcher = new Fetcher(appKey,secretKey,pixabayKey);
    for(let i = 0;i<vals.length;i++){
      fetcher.addAudioTask(
        vals[i].name,
        join(audio,`${i}_item.mp3`)
      );
      fetcher.addAudioTask(
        vals[i].example,
        join(audio,`${i}_example.mp3`)
      );
      mkdirSync(join(image,`i_${i}`),{recursive:true});
      fetcher.addImageTask(
        vals[i].name,
        join(image,`i_${i}`)
      )
    }
    return fetcher;
  }

  public getRaw():DatabaseType{
    return this.raw;
  }

  public getItems():Item[]{
    return Object.values(this.raw);
  }

  public save(){
    writeFileSync(this.path,JSON.stringify(Object.values(this.raw),null,2));
    Logger.getInstance().debug("Database file saved",'database');
  }
}

export type DatabaseType = {[key:string]:Item};

export interface Item{
  name:string,
  example:string,
  description:[string,string],
  image:string,
  audio:[string,string],
  count:number
}