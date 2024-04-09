import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { dataSourceConfigBase } from '~common-service';

export const dataSourceConfig: PostgresConnectionOptions = {
  ...dataSourceConfigBase,
};

console.log(`DB: ${dataSourceConfig.host}:${dataSourceConfig.port}`);

export const AppDataSource = new DataSource(dataSourceConfig);
