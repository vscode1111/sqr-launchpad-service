import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
//Do not change to '~common-service', otherwise "npm run db:migration" doesn't work
import { dataSourceConfigBase, printDbConfig } from '~common-service/db';

export const dataSourceConfig: PostgresConnectionOptions = {
  ...dataSourceConfigBase,
};

printDbConfig(dataSourceConfig);

export const AppDataSource = new DataSource(dataSourceConfig);
