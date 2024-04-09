import 'reflect-metadata';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { config, isBuildRun } from '../config';

function getPrefix() {
  return isBuildRun ? 'dist' : 'src';
}

function getPostfix() {
  return isBuildRun ? 'js' : 'ts';
}

export const dataSourceConfigBase: PostgresConnectionOptions = {
  type: 'postgres',
  synchronize: true,
  logging: false,
  migrationsTableName: '__migrations',
  migrations: [`${getPrefix()}/db/migrations/[1234567890]*.${getPostfix()}`],
  subscribers: [],
  entities: [`${getPrefix()}/db/entities/**/*.${getPostfix()}`], //works
  //Custom
  host: config.connections?.pg?.host,
  port: config.connections?.pg?.port,
  username: config.connections?.pg?.user,
  password: config.connections?.pg?.password,
  database: config.connections?.pg?.database,
};
