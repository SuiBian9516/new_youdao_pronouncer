import Utils from "./utils";
import * as path from "path";
import * as fs from 'fs';
import Project, { ProjectManifest } from "./project";
import Logger from "./logger";
import { PATH_CONFIG, PATH_PROJECT, PATH_ROOT } from "./constants";

export default class Pronouncer{
  // private options:PronouncerConfig;
  private config:AppConfig;

  constructor(/*options:PronouncerConfig*/){
    // this.options = options;
    this.config = {
      youdao:{
        appKey:'',
        key:'',
      },
      pixabay:{
        key:""
      },
      projects:{}
    }
  }

  /*
    Structure:
    root_path:
      - projects
      - config.json
  */
  public init(){
    Utils.checkDirectory(PATH_ROOT,true);
    //Check all directories needed
    Utils.checkDirectory(PATH_PROJECT,true);
    const defaultConfig = JSON.stringify({
      youdao:{
        appKey:"",
        secretKey:""
      },
      projects:{

      }
    },null,2);
    Utils.checkFile(PATH_CONFIG,defaultConfig);

    //Load config file
    this.config = JSON.parse(fs.readFileSync(PATH_CONFIG,{encoding:'utf-8'}));
    Logger.getInstance().debug("Config file loaded",'pronouncer');
    Logger.getInstance().debug(JSON.stringify(this.config,null,2),'pronouncer');
  }

  public getProjects():ProjectList{
    let keys = Object.keys(this.config.projects);
    let list:ProjectList = [];
    let projectsMap = this.config.projects;
    for(let k in keys){
      if(this.checkProjectAvailability(projectsMap[k].path)){
        list.push({
          name:k,
          path:projectsMap[k].path,
          lastModifiedTime:projectsMap[k].lastModifiedTime
        });
      }else{
        delete this.config.projects[k];
      }
    }
    this.saveConfig();
    return list;
  }

  public newProject(name:string,p:string){
    this.config.projects[name] = {
      path:p,
      lastModifiedTime:Utils.getTimeString()
    }
    fs.mkdirSync(p,{recursive:true});
    let manifest:ProjectManifest = {
      name:name,
      backgroundColor:"#FFFFFF",
      font:''
    };
    Utils.checkFile(path.join(p,"manifest.json"),JSON.stringify(manifest,null,2));
    Logger.getInstance().debug("One project created",'pronouncer');
    this.saveConfig();
  }

  public deleteProject(name:string){
    fs.rmSync(this.config.projects[name].path,{
      recursive:true,
      force:true
    });
    delete this.config.projects[name];
    Logger.getInstance().debug("One project deleted",'pronouncer');
    this.saveConfig();
  }

  public checkProjectAvailability(p:string):boolean{
    if (fs.existsSync(p) && fs.existsSync(path.join(p,"manifest.json"))){
      return true;
    }else{
      return false;
    }
  }

  public getProject(name:string):Project{
    if(name in this.config.projects){
      let {path} = this.config.projects[name];
      return (new Project(name,path));
    }else{
      throw new Error("No such project");
    }
  }

  public getYoudaoKeys():{
    appKey:string,
    secretKey:string
  }{
    return {appKey:this.config.youdao.appKey,secretKey:this.config.youdao.key}
  }

  public getPixabayKey():string{
    return this.config.pixabay.key;
  }

  public saveConfig(){
    fs.writeFileSync(PATH_CONFIG,JSON.stringify(this.config,null,2));
    Logger.getInstance().debug("Config file saved",'pronouncer');
  }
}

export interface PronouncerConfig{
  
}

export interface AppConfig{
  youdao:{
    appKey:string,
    key:string
  },
  pixabay:{
    key:string
  },
  projects:{[projectName:string]:{
    path:string,
    lastModifiedTime:string
  }}
}

export type ProjectList = {
  name:string,
  path:string,
  lastModifiedTime:string
}[]