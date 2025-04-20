import Ffmpeg from "fluent-ffmpeg";
import { Item } from "./database";
import { is } from "@electron-toolkit/utils";
import Logger from "./logger";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from "@ffprobe-installer/ffprobe";

export default class Generator{
  private data:Item[]

  constructor(data:Item[]){
    this.data = data;
    if(is.dev){
      Ffmpeg.setFfmpegPath(ffmpegPath.path);
      Ffmpeg.setFfprobePath(ffprobePath.path);
    }else{
      Ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));
      Ffmpeg.setFfprobePath(ffprobePath.path.replace('app.asar', 'app.asar.unpacked'));
    }
  }
}