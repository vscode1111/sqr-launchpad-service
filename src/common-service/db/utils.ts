import { FindOptionsWhere, Repository } from 'typeorm';
import { Contract, Network } from '~db';
import { DeployNetworkKey } from '../types';
import { DbQuerable } from './types';

export async function truncateTables(queryRunner: DbQuerable, tables: string[]) {
  for (const table of tables) {
    await queryRunner.query(`TRUNCATE table ${table} CASCADE`);
  }
}

export async function findNetwork(
  networkRepository: Repository<Network>,
  network: DeployNetworkKey,
): Promise<Network> {
  const dbNetwork = await networkRepository.findOneBy({ name: network });
  if (!dbNetwork) {
    throw 'Not found network';
  }
  return dbNetwork;
}

export async function findContracts(
  contractRepository: Repository<Contract>,
  networkRepository: Repository<Network>,
  network?: DeployNetworkKey,
) {
  let findOption: FindOptionsWhere<Contract> = {};
  if (network) {
    const dbNetwork = await findNetwork(networkRepository, network);

    findOption = {
      networkId: dbNetwork.id,
    };
  }
  return contractRepository.findBy(findOption);
}
