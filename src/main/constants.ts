import { app } from "electron";
import * as path from "path";

export const PATH_ROOT = !app.isPackaged?path.join(app.getAppPath(),"pronouncer"):path.join(path.dirname(app.getPath('exe')),'pronouncer');
export const PATH_LOG =path.join(PATH_ROOT,"logs/");
export const PATH_PROJECT = path.join(PATH_ROOT,'projects/');
export const PATH_CONFIG = path.join(PATH_ROOT,'config.json');
export const FONT_PATH = !app.isPackaged
  ? path.join(app.getAppPath(), "resources", "font.ttf")
  : path.join(process.resourcesPath,"font.ttf");