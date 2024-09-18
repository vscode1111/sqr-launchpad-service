import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { dataSourceConfigBase, printDbConfig } from '~common-service/db';

export const dataSourceConfig: PostgresConnectionOptions = {
  ...dataSourceConfigBase,
};

printDbConfig(dataSourceConfig);

export const AppDataSource = new DataSource(dataSourceConfig);
