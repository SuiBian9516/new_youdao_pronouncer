import Utils from "./utils";
import * as path from "path";
import * as fs from 'fs';
import Project, { ProjectManifest } from "./project";
import Logger from "./logger";
import { PATH_CONFIG, PATH_PROJECT, PATH_ROOT } from "./constants";

export default class Pronouncer{
  private config:AppConfig;
  private currentProject:Project | null = null;
  public static instance:Pronouncer;

  constructor(){
    this.config = {
      youdao:{
        appKey:'',
        key:'',
      },
      pixabay:{
        key:""
      },
      deepseek:{
        key:'',
        model:'deepseek-chat'
      },
      projects:{}
    }
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

  public setConfig(config:{youdao:{appKey:string,key:string},pixabay:{key:string},deepseek:{key:string,model:'deepseek-chat'}}){
    this.config = {...config,projects:this.config.projects};
    this.saveConfig();
  }

  public getConfig():{youdao:{appKey:string,key:string},pixabay:{key:string},deepseek:{key:string,model:'deepseek-chat'}}{
    return {
      youdao:this.config.youdao,
      pixabay:this.config.pixabay,
      deepseek:this.config.deepseek
    }
  }

  public getProjects():ProjectList{
    let keys = Object.keys(this.config.projects);
    let list:ProjectList = [];
    let projectsMap = this.config.projects;
    for(let k of keys){
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
      backgroundColor:"#000000",
      characterColor:["#FFFFFF","#E0C410"],
      title:'',
      subtitle:''
    };
    Utils.checkFile(path.join(p,"manifest.json"),JSON.stringify(manifest,null,2));
    Utils.checkFile(path.join(p,"database.json"),JSON.stringify([],null,2));
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

  public openProject(name:string):Project|null{
    if(name in this.config.projects){
      let {path} = this.config.projects[name];
      let project = new Project(name,path);
      this.currentProject = project;
      return project;
    }else{
      return null;
    }
  }

  public getProject():Project|null{
    return this.currentProject;
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

  public getDeepseekKey():{
    key:string,
    model:'deepseek-chat'
  }{
    return {
      key:this.config.deepseek.key,
      model:this.config.deepseek.model
    }
  }

  public saveConfig(){
    fs.writeFileSync(PATH_CONFIG,JSON.stringify(this.config,null,2));
    Logger.getInstance().debug("Config file saved",'pronouncer');
  }

  public static getInstance():Pronouncer{
    if(this.instance){
      return this.instance;
    }else{
      this.instance = new Pronouncer();
      return this.instance;
    }
  }
}

export interface AppConfig{
  youdao:{
    appKey:string,
    key:string
  },
  pixabay:{
    key:string
  },
  deepseek:{
    key:string,
    model:"deepseek-chat"
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