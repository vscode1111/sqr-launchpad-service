import { N } from '~common';
import { DbQuerable, truncateTables } from '~common-service';
import { DbWorkerContractStat } from '~core';
import { processDbTable, rawDbTable } from '~db/tableNames';
import { Contract } from './entities';

export async function dbSoftReset(queryRunner: DbQuerable): Promise<void> {
  await truncateTables(queryRunner, [processDbTable.transaction_items, processDbTable.accounts]);
  await queryRunner.query(
    `UPDATE ${rawDbTable._contracts} SET "${N<Contract>('processBlockNumber')}" = 0`,
  );
}

export async function dbHardReset(queryRunner: DbQuerable): Promise<void> {
  await truncateTables(queryRunner, [
    processDbTable.transaction_items,
    processDbTable.accounts,
    rawDbTable._events,
    rawDbTable._transactions,
    rawDbTable._blocks,
    rawDbTable._contracts,
    rawDbTable._networks,
  ]);
}

export function mapContract(contract: Contract): DbWorkerContractStat {
  return {
    address: contract.address,
    name: contract.name || undefined,
    syncBlockNumber: contract.syncBlockNumber,
    processBlockNumber: contract.processBlockNumber,
  };
}
