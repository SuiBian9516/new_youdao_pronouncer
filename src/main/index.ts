import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron';
import { dirname, extname, join } from 'path';
import { optimizer, is } from '@electron-toolkit/utils';
import Logger from './logger';
import axios from 'axios';
import Pronouncer from './pronouncer';
import { PATH_PROJECT, VERSION, AUTHORS } from './constants';
import * as fs from 'fs';
import Deepseek from './deepseek';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: join(process.cwd(), 'app.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    Logger.getInstance().debug('Window showed', 'main');
  });

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

const pronouncer = Pronouncer.getInstance();

ipcMain.handle('fetch-bing-wallpaper', async () => {
  try {
    const response = await axios.get(
      'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
    );
    const imageUrl = `https://www.bing.com${response.data.images[0].url}`;

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    return { success: true, imageUrl: base64Image };
  } catch (error) {
    console.error('Failed to fetch Bing wallpaper:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('setting:get', async () => {
  try {
    const youdaoKeys = pronouncer.getYoudaoKeys();
    const pixabayKey = pronouncer.getPixabayKey();
    const deepseekConfig = pronouncer.getDeepseekKey();

    return {
      youdao: {
        appKey: youdaoKeys.appKey,
        key: youdaoKeys.secretKey,
      },
      pixabay: {
        key: pixabayKey,
      },
      deepseek: {
        apiKey: deepseekConfig?.key || '',
      },
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to get config: ${error}`, 'main');
    throw error;
  }
});

ipcMain.handle('setting:save', async (_, config) => {
  try {
    pronouncer.setConfig({
      youdao: {
        appKey: config.youdao.appKey,
        key: config.youdao.key,
      },
      pixabay: {
        key: config.pixabay.key,
      },
      deepseek: {
        key: config.deepseek.apiKey,
        model: 'deepseek-chat',
      },
    });

    return true;
  } catch (error) {
    Logger.getInstance().error(`Fail to save config: ${error}`, 'main');
    throw error;
  }
});

ipcMain.handle('project:get-all', async () => {
  return pronouncer.getProjects();
});

ipcMain.handle('project:open', async (_, projectName) => {
  try {
    const project = pronouncer.openProject(projectName);

    if (project) {
      const projectInfo = pronouncer.getProjects().find(p => p.name === projectName);
      if (projectInfo) {
        projectInfo.lastModifiedTime = new Date().toLocaleString();
        pronouncer.saveConfig();
      }

      return {
        success: true,
        project: {
          name: projectName,
          path: project.getPath(),
        },
      };
    } else {
      return {
        success: false,
        message: `Unable to open project: ${projectName}`,
      };
    }
  } catch (error) {
    Logger.getInstance().error(`Unable to open project: ${error}`, 'main');
    return {
      success: false,
      message: `打开项目时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('project:delete', async (_, projectName) => {
  try {
    const projects = pronouncer.getProjects();
    const projectExists = projects.some(p => p.name === projectName);

    if (!projectExists) {
      return {
        success: false,
        message: `项目 "${projectName}" 不存在`,
      };
    }

    pronouncer.deleteProject(projectName);

    Logger.getInstance().info(`Success to delete project: ${projectName}`, 'main');
    return {
      success: true,
      message: `项目 "${projectName}" 已成功删除`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to delete project: ${error}`, 'main');
    return {
      success: false,
      message: `删除项目时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('dialog:select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择位置',
      buttonLabel: '选择文件夹',
    });

    return result;
  } catch (error) {
    Logger.getInstance().error(`Fail to choose folder: ${error}`, 'main');
    throw error;
  }
});

ipcMain.handle('project:create', async (_, projectInfo) => {
  try {
    const { name, path: projectPath, manifest } = projectInfo;
    const projects = pronouncer.getProjects();
    const projectExists = projects.some(p => p.name === name);

    if (projectExists) {
      return {
        success: false,
        message: `项目名称 "${name}" 已存在`,
      };
    }

    try {
      pronouncer.newProject(name, join(projectPath, name), manifest);

      Logger.getInstance().info(`Success to create project: ${name}`, 'main');
      return {
        success: true,
        message: `项目 "${name}" 已成功创建`,
      };
    } catch (error) {
      Logger.getInstance().error(`Invalid path: ${error}`, 'main');
      return {
        success: false,
        message: `项目路径无效: ${error}`,
      };
    }
  } catch (error) {
    Logger.getInstance().error(`Fail to create project: ${error}`, 'main');
    return {
      success: false,
      message: `创建项目时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('database:get-all', async () => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
        items: [],
      };
    }

    const database = currentProject.getDatabase();
    const items = database.getItems();

    return {
      success: true,
      items: items,
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to fetch data: ${error}`, 'main');
    return {
      success: false,
      message: `获取项目数据失败: ${error}`,
      items: [],
    };
  }
});

ipcMain.handle('database:add-item', async (_, item) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    const { name, example, description, count } = item;

    if (!name || name.trim() === '') {
      return {
        success: false,
        message: '名称不能为空',
      };
    }

    const database = currentProject.getDatabase();

    try {
      const existingItem = database.getItem(name);
      if (existingItem) {
        return {
          success: false,
          message: `项目 "${name}" 已存在`,
        };
      }
    } catch (error) {
      Logger.getInstance().error(`Unknown error: ${error}`, 'main');
    }

    database.addItem(name, example || '', description, count || 1);

    database.save();

    Logger.getInstance().info(`Success to add item: ${name}`, 'main');
    return {
      success: true,
      message: `数据项 "${name}" 已成功添加`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to add item: ${error}`, 'main');
    return {
      success: false,
      message: `添加数据项失败: ${error}`,
    };
  }
});

ipcMain.handle('database:update-item', async (_, item) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    const { name, example, description, count } = item;

    if (!name || name.trim() === '') {
      return {
        success: false,
        message: '名称不能为空',
      };
    }

    const database = currentProject.getDatabase();

    try {
      database.getItem(name);
    } catch (error) {
      return {
        success: false,
        message: `项目 "${name}" 不存在`,
      };
    }

    database.deleteItem(name);
    database.addItem(name, example || '', description, count || 1);

    database.save();

    Logger.getInstance().info(`Success to update item: ${name}`, 'main');
    return {
      success: true,
      message: `数据项 "${name}" 已成功更新`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to update item: ${error}`, 'main');
    return {
      success: false,
      message: `更新数据项失败: ${error}`,
    };
  }
});

ipcMain.handle('database:delete-item', async (_, itemName) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    if (!itemName || itemName.trim() === '') {
      return {
        success: false,
        message: '名称不能为空',
      };
    }

    const database = currentProject.getDatabase();

    try {
      database.getItem(itemName);
    } catch (error) {
      return {
        success: false,
        message: `项目 "${itemName}" 不存在`,
      };
    }

    database.deleteItem(itemName);

    database.save();

    Logger.getInstance().info(`Success to delete item: ${itemName}`, 'main');
    return {
      success: true,
      message: `数据项 "${itemName}" 已成功删除`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to delete item: ${error}`, 'main');
    return {
      success: false,
      message: `删除数据项失败: ${error}`,
    };
  }
});

ipcMain.handle('database:save-order', async (_, items) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    const database = currentProject.getDatabase();

    database.saveOrder(items);

    Logger.getInstance().info(`Success to save data order`, 'main');
    return {
      success: true,
      message: '数据排序已成功保存',
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to save data order: ${error}`, 'main');
    return {
      success: false,
      message: `保存数据排序失败: ${error}`,
    };
  }
});

ipcMain.on('open-external', (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get:default-project-path', () => {
  return PATH_PROJECT;
});

ipcMain.handle('project:get-manifest', async (_, projectName) => {
  try {
    if (!projectName) {
      const currentProject = pronouncer.getProject();
      if (!currentProject) {
        return {
          success: false,
          message: '没有提供项目名称且没有打开的项目',
        };
      }
      projectName = currentProject.getName();
    }

    const project = pronouncer.openProject(projectName);

    if (!project) {
      return {
        success: false,
        message: `无法打开项目: ${projectName}`,
      };
    }

    const manifest = project.getManifest();

    Logger.getInstance().info(`Success to fetch manifest: ${projectName}`, 'main');
    return {
      success: true,
      manifest,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to fetch manifest: ${error}`, 'main');
    return {
      success: false,
      message: `获取项目清单时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('project:update-manifest', async (_, projectName, manifest) => {
  try {
    const project = pronouncer.openProject(projectName);

    if (!project) {
      return {
        success: false,
        message: `无法打开项目: ${projectName}`,
      };
    }

    const success = project.updateManifest(manifest);

    if (!success) {
      return {
        success: false,
        message: '更新项目清单失败',
      };
    }

    const projectInfo = pronouncer.getProjects().find(p => p.name === projectName);
    if (projectInfo) {
      projectInfo.lastModifiedTime = new Date().toLocaleString();
      pronouncer.saveConfig();
    }

    Logger.getInstance().info(`Success to update manifest: ${projectName}`, 'main');
    return {
      success: true,
      message: `项目清单已成功更新`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to update manifest: ${error}`, 'main');
    return {
      success: false,
      message: `更新项目清单时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('project:generate-video', async (_, projectName, outputPath) => {
  try {
    const project = pronouncer.openProject(projectName);

    if (!project) {
      return {
        success: false,
        message: `无法打开项目: ${projectName}`,
      };
    }

    const defaultOutputPath = join(
      app.getPath('videos'),
      `${projectName}_${new Date().getTime()}.mp4`
    );
    const finalOutputPath = outputPath || defaultOutputPath;

    Logger.getInstance().info(
      `Start to generate video: ${projectName}, output path: ${finalOutputPath}`,
      'main'
    );

    let { appKey, secretKey } = pronouncer.getYoudaoKeys();
    let pixabayKey = pronouncer.getPixabayKey();
    let db = project.getDatabase();
    let fetcher = db.getFetcher(
      appKey,
      secretKey,
      pixabayKey,
      project.getAudioCachePath(),
      project.getImageCachePath()
    );
    await fetcher.audioFetch();
    await fetcher.imageFetch();
    await project.generateVideo(finalOutputPath);

    const projectInfo = pronouncer.getProjects().find(p => p.name === projectName);
    if (projectInfo) {
      projectInfo.lastModifiedTime = new Date().toLocaleString();
      pronouncer.saveConfig();
    }

    Logger.getInstance().info(`Success to generate video: ${finalOutputPath}`, 'main');
    return {
      success: true,
      filePath: finalOutputPath,
      message: `视频已成功生成: ${finalOutputPath}`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to generate video: ${error}`, 'main');
    return {
      success: false,
      message: `生成视频时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('dialog:show-item-in-folder', async (_, path) => {
  shell.showItemInFolder(path);
});

ipcMain.handle('database:get-audio-path', async (_, itemName) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    const db = currentProject.getDatabase();
    const audioPaths = db.getAudioPath(itemName);

    return {
      success: true,
      paths: audioPaths,
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to fetch audio: ${error}`, 'main');
    return {
      success: false,
      message: `获取音频路径时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('database:get-image-path', async (_, itemName) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    const db = currentProject.getDatabase();
    const item = db.getItem(itemName);

    if (!item) {
      return {
        success: false,
        message: `找不到项目: ${itemName}`,
      };
    }

    if (item.image != '') {
      const imageDir = dirname(item.image);
      const imagePaths = db.getImagePath(itemName).map(filename => join(imageDir, filename));

      return {
        success: true,
        paths: imagePaths,
      };
    } else {
      return {
        success: true,
        paths: [],
      };
    }
  } catch (error) {
    Logger.getInstance().error(`Unable to fetch image: ${error}`, 'main');
    return {
      success: false,
      message: `获取图片路径时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('file:get-base64', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: `文件不存在: ${filePath}`,
      };
    }

    const fileContent = fs.readFileSync(filePath);
    const base64Content = fileContent.toString('base64');

    const fileExt = extname(filePath).toLowerCase();
    let mimeType = 'application/octet-stream';

    if (fileExt === '.png') mimeType = 'image/png';
    else if (fileExt === '.jpg' || fileExt === '.jpeg') mimeType = 'image/jpeg';
    else if (fileExt === '.gif') mimeType = 'image/gif';
    else if (fileExt === '.mp3') mimeType = 'audio/mpeg';
    else if (fileExt === '.wav') mimeType = 'audio/wav';

    return {
      success: true,
      base64: `data:${mimeType};base64,${base64Content}`,
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to get Base64 coding: ${error}`, 'main');
    return {
      success: false,
      message: `获取文件Base64编码失败: ${error}`,
    };
  }
});

ipcMain.handle('database:set-audio', async (_, itemName, audioPath, isExample) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    if (!fs.existsSync(audioPath)) {
      return {
        success: false,
        message: `音频文件不存在: ${audioPath}`,
      };
    }

    const ext = extname(audioPath).toLowerCase();
    if (ext !== '.mp3' && ext !== '.wav') {
      return {
        success: false,
        message: '仅支持MP3或WAV格式的音频文件',
      };
    }

    const db = currentProject.getDatabase();
    const item = db.getItem(itemName);

    if (!item) {
      return {
        success: false,
        message: `找不到项目: ${itemName}`,
      };
    }

    const audioPaths = db.getAudioPath(itemName);

    const audioCachePath = currentProject.getAudioCachePath();
    const fileName = isExample ? `${item.id}_example.mp3` : `${item.id}_item.mp3`;
    const targetPath = join(audioCachePath, fileName);

    fs.copyFileSync(audioPath, targetPath);

    const newAudioPaths = [...audioPaths];
    newAudioPaths[isExample ? 1 : 0] = targetPath;
    db.setItemAudio(itemName, newAudioPaths as [string, string]);
    db.save();

    return {
      success: true,
      message: `音频已成功设置`,
      path: targetPath,
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to set audio path: ${error}`, 'main');
    return {
      success: false,
      message: `设置音频路径时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('database:set-image', async (_, itemName, imagePath) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        message: `图片文件不存在: ${imagePath}`,
      };
    }

    const ext = extname(imagePath).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif') {
      return {
        success: false,
        message: '仅支持PNG、JPG或GIF格式的图片文件',
      };
    }

    const db = currentProject.getDatabase();
    const item = db.getItem(itemName);

    if (!item) {
      return {
        success: false,
        message: `找不到项目: ${itemName}`,
      };
    }

    const imageCachePath = join(currentProject.getImageCachePath(), `i_${item.id}`);

    if (!fs.existsSync(imageCachePath)) {
      fs.mkdirSync(imageCachePath, { recursive: true });
    }

    const files = fs.readdirSync(imageCachePath);
    const imageIndex = files.length;
    const targetPath = join(imageCachePath, `image_${imageIndex}.png`);

    fs.copyFileSync(imagePath, targetPath);

    if (imageIndex === 0 || item.image === '') {
      db.setItemImage(itemName, targetPath);
      db.save();
    }

    return {
      success: true,
      message: `图片已成功添加`,
      path: targetPath,
      isDefault: imageIndex === 0 || item.image === '',
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to set image path: ${error}`, 'main');
    return {
      success: false,
      message: `设置图片路径时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('database:set-default-image', async (_, itemName, imagePath) => {
  try {
    const currentProject = pronouncer.getProject();

    if (!currentProject) {
      return {
        success: false,
        message: '没有打开的项目',
      };
    }

    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        message: `图片不存在: ${imagePath}`,
      };
    }

    const db = currentProject.getDatabase();
    const item = db.getItem(itemName);

    if (!item) {
      return {
        success: false,
        message: `找不到项目: ${itemName}`,
      };
    }
    db.setItemImage(itemName, imagePath);
    db.save();

    Logger.getInstance().info(`Set ${imagePath} to the default image of ${itemName} `, 'main');
    return {
      success: true,
      message: '默认图片设置成功',
    };
  } catch (error) {
    Logger.getInstance().error(`Unable to set default image: ${error}`, 'main');
    return {
      success: false,
      message: `设置默认图片时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('dialog:select-audio', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '选择音频文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'wav'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    return result;
  } catch (error) {
    Logger.getInstance().error(`Unable to choose audio: ${error}`, 'main');
    throw error;
  }
});

ipcMain.handle('dialog:select-image', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: '选择图片文件',
      filters: [
        { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'gif'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });

    return result;
  } catch (error) {
    Logger.getInstance().error(`选择图片文件失败: ${error}`, 'main');
    throw error;
  }
});

ipcMain.handle('project:clear-cache', async (_, projectName) => {
  try {
    const project = pronouncer.openProject(projectName);

    if (!project) {
      return {
        success: false,
        message: `无法打开项目: ${projectName}`,
      };
    }

    project.clearCache();

    Logger.getInstance().info(`Success to clear ${projectName} cache`, 'main');
    return {
      success: true,
      message: `项目 "${projectName}" 的缓存已成功清除`,
    };
  } catch (error) {
    Logger.getInstance().error(`Fail to clear cache: ${error}`, 'main');
    return {
      success: false,
      message: `清除项目缓存时发生错误: ${error}`,
    };
  }
});

ipcMain.handle('ai:import-data', async (_, data: string) => {
  let { key, model } = pronouncer.getDeepseekKey();
  let ai = new Deepseek(key, model);
  try {
    let cache = await ai.handleRawDocument(data);
    let project = pronouncer.getProject();
    let db = project.getDatabase();
    for (let k of cache) {
      db.addItem(k.name, k.example, [k.description, k.exampleDescription], 1);
    }
    db.save();
    return {
      success: true,
      message: `成功导入`,
    };
  } catch (e) {
    return {
      success: false,
      message: `导入数据时出现错误：${e?.message}`,
    };
  }
});

ipcMain.handle('ai:build-sentence', async (_, item: string, explanation: string) => {
  let { key, model } = pronouncer.getDeepseekKey();
  let ai = new Deepseek(key, model);
  try {
    let cache = await ai.handleExampleSentence(item, explanation);
    return {
      success: true,
      message: `成功编写例句`,
      data: [cache.example, cache.description],
    };
  } catch (e) {
    return {
      success: false,
      message: `编写例句时出现错误：${e?.message}`,
      data: ['', ''],
    };
  }
});

ipcMain.handle('database:fetch-all', async _ => {
  try {
    const project = pronouncer.getProject();
    let { appKey, secretKey } = pronouncer.getYoudaoKeys();
    let pixabayKey = pronouncer.getPixabayKey();
    let db = project.getDatabase();
    let fetcher = db.getFetcher(
      appKey,
      secretKey,
      pixabayKey,
      project.getAudioCachePath(),
      project.getImageCachePath()
    );
    await fetcher.audioFetch();
    await fetcher.imageFetch();
    return {
      success: true,
      message: '拉取成功',
    };
  } catch (e) {
    return {
      success: false,
      message: `在拉取时出现了问题：${e}`,
    };
  }
});

ipcMain.handle('get-metadata', async _ => {
  return {
    version: VERSION.join('.'),
    authors: AUTHORS,
  };
});

app.whenReady().then(async () => {
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
