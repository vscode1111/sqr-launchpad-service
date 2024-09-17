import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { exist } from '~common';
import { CContract, Contract, Network, PContract } from '~db/entities';
import { DeployNetworkKey } from '../types';
import {
  DbQuerable,
  DbWorkerContractStat,
  FindContractsParams,
  OrderByParams,
  OrderType,
} from './types';

export async function truncateTables(queryRunner: DbQuerable, tables: string[]) {
  for (const table of tables) {
    await queryRunner.query(`TRUNCATE table ${table} CASCADE`);
  }
}

export async function findNetwork(
  network: DeployNetworkKey,
  networkRepository: Repository<Network>,
): Promise<Network> {
  const dbNetwork = await networkRepository.findOneBy({ name: network });
  if (!dbNetwork) {
    throw 'Not found network';
  }
  return dbNetwork;
}

export async function findContract(
  contractRepository: Repository<Contract>,
  address: string,
  networkRepository?: Repository<Network>,
  network?: DeployNetworkKey,
): Promise<Contract | null> {
  let findOption: FindOptionsWhere<Contract> = { address };
  if (network && networkRepository) {
    const dbNetwork = await findNetwork(network, networkRepository);

    findOption = {
      ...findOption,
      networkId: dbNetwork.id,
    };
  }
  return contractRepository.findOneBy(findOption);
}

export async function createContractsQueryBuilder({
  contractRepository,
  networkRepository,
  network,
  notDisable = true,
  limit,
  offset,
  orderBy,
}: FindContractsParams): Promise<SelectQueryBuilder<Contract>> {
  const createQueryBuilder = contractRepository.createQueryBuilder(CContract);

  if (exist(network)) {
    const dbNetwork = await findNetwork(network!, networkRepository);
    createQueryBuilder.andWhere(`${PContract('networkId')} = :id`, { id: dbNetwork.id });
  }

  if (notDisable) {
    createQueryBuilder.andWhere(`${PContract('disable')} IS NOT TRUE`);
  }

  if (exist(limit)) {
    createQueryBuilder.limit(limit);
  }

  if (exist(offset)) {
    createQueryBuilder.offset(offset);
  }

  if (exist(orderBy)) {
    createQueryBuilder.orderBy(orderBy!.sort, orderBy!.order);
  }

  return createQueryBuilder;
}

export async function findContracts(params: FindContractsParams): Promise<Contract[]> {
  const createQueryBuilder = await createContractsQueryBuilder(params);
  return createQueryBuilder.getMany();
}

export async function findContractsAndCount(
  params: FindContractsParams,
): Promise<[Contract[], number]> {
  const createQueryBuilder = await createContractsQueryBuilder(params);
  return createQueryBuilder.getManyAndCount();
}

export async function findContractsAndCountEx(
  params: FindContractsParams,
): Promise<[Contract[], number]> {
  const createQueryBuilder = await createContractsQueryBuilder(params);
  return createQueryBuilder.getManyAndCount();
}

export function mapContract(contract: Contract): DbWorkerContractStat {
  return {
    address: contract.address,
    name: contract.name || undefined,
    syncBlockNumber: contract.syncBlockNumber,
    processBlockNumber: contract.processBlockNumber,
    disable: contract.disable || undefined,
    type: contract.type || undefined,
  };
}

export function printDbConfig(dataSourceConfig: PostgresConnectionOptions) {
  console.log(`DB: ${dataSourceConfig.host}:${dataSourceConfig.port} ${dataSourceConfig.database}`);
}

export function parseOrderBy(value: string, sortPrefix = ''): OrderByParams {
  const [sort, order] = value.split(' ');
  return {
    sort: `${sortPrefix}.${sort}`,
    order: order as OrderType,
  };
}
