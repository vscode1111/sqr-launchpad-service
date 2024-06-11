import Bluebird from 'bluebird';
import { ServiceBroker } from 'moleculer';
import { DataSource, Repository } from 'typeorm';
import { createDatabase } from 'typeorm-extension';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { IdLock, Promisable, Started, Stopped, toDate } from '~common';
//Do not change to '~db', otherwise "npm run start" doesn't work
import { Block, Contract, ContractType, Event, Network, Transaction } from '../../db/entities';
import { DB_CONCURRENCY_COUNT, GENESIS_BLOCK_NUMBER } from '../constants';
import { ServiceBrokerBase } from '../core';
import { DeployNetworkKey, GetBlockFn, GetTransactionByHashFn, Web3Event } from '../types';
import { deployNetworks, logInfo } from '../utils';
import { GetContractDataFn } from './types';
import { findContract, findContracts, findNetwork } from './utils';

const CREATED_DATABASE = false;

export class DataStorageBase extends ServiceBrokerBase implements Started, Stopped {
  protected dataSourceOptions: PostgresConnectionOptions;
  protected dataSource!: DataSource;
  protected networkRepository!: Repository<Network>;
  protected contractRepository!: Repository<Contract>;
  protected eventRepository!: Repository<Event>;
  protected transactionRepository!: Repository<Transaction>;
  protected isDestroyed: boolean;
  protected idLock: IdLock;
  protected getContractDataFn: GetContractDataFn;
  protected getBlockFn!: GetBlockFn;
  protected getTransactionByHashFn!: GetTransactionByHashFn;

  constructor(
    broker: ServiceBroker,
    dataSourceOptions: PostgresConnectionOptions,
    getContractDataFn: GetContractDataFn,
  ) {
    super(broker);
    this.dataSourceOptions = dataSourceOptions;
    this.dataSource = new DataSource(this.dataSourceOptions);
    this.getContractDataFn = getContractDataFn;
    this.isDestroyed = false;
    this.idLock = new IdLock();
  }

  getDataSource() {
    return this.dataSource;
  }

  async initialize(): Promise<void> {
    if (CREATED_DATABASE) {
      await createDatabase({ options: this.dataSourceOptions, ifNotExist: true });
    }

    if (this.isDestroyed) {
      this.dataSource = new DataSource(this.dataSourceOptions);
      this.isDestroyed = false;
    }

    await this.dataSource.initialize();

    this.networkRepository = this.dataSource.getRepository(Network);
    this.contractRepository = this.dataSource.getRepository(Contract);
    this.transactionRepository = this.dataSource.getRepository(Transaction);
    this.eventRepository = this.dataSource.getRepository(Event);

    this.updateContracts(this.getContractDataFn);
  }

  async updateContracts(getContractData: GetContractDataFn) {
    await this.dataSource.transaction(async (entityManager) => {
      const networkRepository = entityManager.getRepository(Network);
      const contractRepository = entityManager.getRepository(Contract);
      for (const network of deployNetworks) {
        const dbNetwork = await this.getOrSaveNetwork(network, networkRepository);

        const contractData = getContractData(network);

        for (const contractItem of contractData) {
          const foundContract = await findContract(
            contractRepository,
            contractItem.address,
            networkRepository,
            network,
          );

          if (foundContract) {
            if (typeof contractItem.disable !== 'undefined') {
              foundContract.disable = contractItem.disable;
            }
            if (typeof contractItem.type !== 'undefined') {
              foundContract.type = contractItem.type as ContractType;
            }
            await contractRepository.save(foundContract);
          } else {
            const dbContract = new Contract();
            dbContract.address = contractItem.address;
            dbContract.syncBlockNumber = contractItem.blockNumber ?? 0;
            dbContract.processBlockNumber = contractItem.blockNumber ?? 0;
            dbContract.network = dbNetwork;
            if (typeof contractItem.disable !== 'undefined') {
              dbContract.disable = contractItem.disable;
            }
            if (typeof contractItem.type !== 'undefined') {
              dbContract.type = contractItem.type as ContractType;
            }
            await contractRepository.save(dbContract);
          }
        }
      }
    });
  }

  setRpcFns({
    getBlockFn,
    getTransactionByHashFn,
  }: {
    getBlockFn: GetBlockFn;
    getTransactionByHashFn: GetTransactionByHashFn;
  }) {
    this.getBlockFn = getBlockFn;
    this.getTransactionByHashFn = getTransactionByHashFn;
  }

  async start(): Promise<void> {
    logInfo(this.broker, `Connecting to database...`);
    await this.initialize();
  }

  async stop(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      return;
    }

    await this.dataSource.destroy();
    this.isDestroyed = true;
  }

  async hardReset(): Promise<void> {
    await this.dataSource.destroy();
    this.isDestroyed = true;
    logInfo(this.broker, `Database was dropped`);
  }

  async getNetwork(network: DeployNetworkKey): Promise<Network> {
    return findNetwork(network, this.networkRepository);
  }

  async getOrSaveNetwork(
    network: DeployNetworkKey,
    networkRepository: Repository<Network>,
  ): Promise<Network> {
    return this.idLock.tryInvoke(`network_${network}`, async () => {
      let dbNetwork = await networkRepository.findOneBy({ name: network });
      if (!dbNetwork) {
        dbNetwork = new Network();
        dbNetwork.name = network;
        await networkRepository.save(dbNetwork);
      }

      return dbNetwork;
    });
  }

  async getContract(address: string) {
    return this.contractRepository.findOneBy({ address });
  }

  async getContracts(network?: DeployNetworkKey) {
    return findContracts(this.contractRepository, this.networkRepository, network);
  }

  private async getOrSaveBlock(
    dbNetwork: Network,
    blockNumber: number,
    blockRepository: Repository<Block>,
  ) {
    return this.idLock.tryInvoke(`block_${blockNumber}`, async () => {
      let dbBlock = await blockRepository.findOneBy({ number: blockNumber });
      if (!dbBlock) {
        const block = await this.getBlockFn(blockNumber);
        dbBlock = new Block();
        dbBlock.network = dbNetwork;
        dbBlock.number = block.number;
        dbBlock.hash = block.hash;
        dbBlock.timestamp = toDate(block.timestamp);
        await blockRepository.save(dbBlock);
      }

      return dbBlock;
    });
  }

  private async updateTransaction(
    dbNetwork: Network,
    transactionHash: string,
    dbBlock: Block,
    transactionRepository: Repository<Transaction>,
    dbTransaction: Transaction,
  ) {
    const transaction = await this.getTransactionByHashFn(transactionHash);
    dbTransaction.network = dbNetwork;
    dbTransaction.hash = transaction.hash;
    dbTransaction.transactionIndex = transaction.transactionIndex;
    dbTransaction.block = dbBlock;
    dbTransaction.from = transaction.from;
    dbTransaction.to = transaction.to;
    dbTransaction.gas = transaction.gas;
    dbTransaction.gasPrice = transaction.gasPrice;
    dbTransaction.input = transaction.input;
    dbTransaction.nonce = transaction.nonce;
    dbTransaction.value = transaction.value;
    await transactionRepository.save(dbTransaction);
  }

  private async getOrSaveTransaction(
    dbNetwork: Network,
    transactionHash: string,
    dbBlock: Block,
    transactionRepository: Repository<Transaction>,
  ) {
    return this.idLock.tryInvoke(`transaction_${transactionHash}`, async () => {
      let dbTransaction = await transactionRepository.findOneBy({ hash: transactionHash });
      if (dbTransaction?.blockNumber === GENESIS_BLOCK_NUMBER) {
        await this.updateTransaction(
          dbNetwork,
          transactionHash,
          dbBlock,
          transactionRepository,
          dbTransaction,
        );
      }
      if (!dbTransaction) {
        dbTransaction = new Transaction();
        await this.updateTransaction(
          dbNetwork,
          transactionHash,
          dbBlock,
          transactionRepository,
          dbTransaction,
        );
      }
      return dbTransaction;
    });
  }

  private async saveEvent(
    event: Web3Event,
    dbNetwork: Network,
    dbAddress: Contract,
    dbTransaction: Transaction,
    eventRepository: Repository<Event>,
  ) {
    const topic0 = event.topics.length > 0 ? event.topics[0] : 'topic0';
    return this.idLock.tryInvoke(
      `event_${event.transactionHash}_${topic0}_${event.logIndex}`,
      async () => {
        const dbEvent = new Event();

        dbEvent.network = dbNetwork;
        dbEvent.transactionHash = dbTransaction;
        dbEvent.topic0 = event.topics[0];
        if (event.topics[1]) {
          dbEvent.topic1 = event.topics[1];
        }
        if (event.topics[2]) {
          dbEvent.topic2 = event.topics[2];
        }
        if (event.topics[3]) {
          dbEvent.topic3 = event.topics[3];
        }
        dbEvent.data = event.data;
        dbEvent.transactionIndex = event.transactionIndex;
        dbEvent.contract = dbAddress;
        dbEvent.logIndex = event.logIndex;
        dbEvent.removed = event.removed;

        await eventRepository.save(dbEvent);
      },
    );
  }

  async saveEvents({
    events,
    contractAddress,
    blockNumber,
    network,
    onProcessEvent,
  }: {
    events: Web3Event[];
    contractAddress: string;
    blockNumber: number;
    network: DeployNetworkKey;
    onProcessEvent?: (web3Event: Web3Event) => Promisable<void>;
  }): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      const networkRepository = entityManager.getRepository(Network);
      const contractRepository = entityManager.getRepository(Contract);
      const blockRepository = entityManager.getRepository(Block);
      const transactionRepository = entityManager.getRepository(Transaction);
      const eventRepository = entityManager.getRepository(Event);

      const dbNetwork = await networkRepository.findOneBy({ name: network });
      if (!dbNetwork) {
        return;
      }

      const dbContract = await this.getContract(contractAddress);
      if (!dbContract) {
        return;
      }

      await Bluebird.map(
        events,
        async (event) => {
          const dbBlock = await this.getOrSaveBlock(dbNetwork, event.blockNumber, blockRepository);

          const dbTransaction = await this.getOrSaveTransaction(
            dbNetwork,
            event.transactionHash,
            dbBlock,
            transactionRepository,
          );

          if (onProcessEvent) {
            await onProcessEvent(event);
          }

          await this.saveEvent(event, dbNetwork, dbContract, dbTransaction, eventRepository);
        },
        { concurrency: DB_CONCURRENCY_COUNT },
      );

      dbContract.syncBlockNumber = blockNumber + 1;
      await contractRepository.save(dbContract);
    });
  }
}
