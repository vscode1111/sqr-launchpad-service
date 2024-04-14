import appRoot from 'app-root-path';
import path from 'path';
import { toBoolean } from '~common';
import { BaseConfig } from './types';

export * from './types';
export * from './utils';

const PRINT_CONFIG = false;

export const config: BaseConfig = require(path.join(appRoot.path, 'config'));

if (PRINT_CONFIG) {
  console.log('config:', config);
}

export const isProdEnv = global.ENV === 'prod';
export const isLocalOrDevEnv = ['local', 'dev'].includes(global.ENV);
export const isBuildRun = toBoolean(global.BUILD);
