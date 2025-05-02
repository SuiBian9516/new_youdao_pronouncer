import { app } from 'electron';
import { join } from 'path';

export const PATH_ROOT = join(app.getPath('appData'), 'YoudaoPronouncer');
export const PATH_PROJECT = join(PATH_ROOT, 'projects');
export const PATH_CONFIG = join(PATH_ROOT, 'config.json');
export const PATH_LOG = join(PATH_ROOT, 'logs');

export const VERSION = app.getVersion();

export const AUTHORS = ['SuiBian9516 <m1311826090@outlook.com>', 'AhgNum <x_ahgmum_x@foxmail.com>'];
