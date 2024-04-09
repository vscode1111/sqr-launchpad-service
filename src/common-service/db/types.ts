import { QueryRunner } from 'typeorm';

export interface DbQuerable {
  query<T = any>(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<T>;
}
