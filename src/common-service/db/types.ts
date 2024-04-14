import { QueryRunner } from 'typeorm';
import { Web3ConfigContract } from '../config';
import { DeployNetworkKey } from '../types';

export interface DbQuerable {
  query<T = any>(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<T>;
}

export type GetContractDataFn = (network: DeployNetworkKey) => Web3ConfigContract[];
