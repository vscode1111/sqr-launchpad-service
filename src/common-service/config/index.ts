import appRoot from 'app-root-path';
import { BaseConfig } from 'msq-moleculer-core';
import path from 'path';
import { toBoolean } from '~common';

export * from './utils';

const LOG_CONSOLE = false;

export const config: BaseConfig = require(path.join(appRoot.path, 'config'));

if (LOG_CONSOLE) {
  console.log('config:', config);
}

export const isProdEnv = global.ENV === 'prod';
export const isLocalOrDevEnv = ['local', 'dev'].includes(global.ENV);
export const isBuildRun = toBoolean(global.BUILD);
