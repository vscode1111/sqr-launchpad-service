import Bluebird from 'bluebird';
import { Context } from 'moleculer';
import { DeleteResult, UpdateResult } from 'typeorm';
import { checkIfAddress, checkIfNumber, toDate, toNumberDecimals } from '~common';
import {
  CacheMachine,
  checkIfNetwork,
  commonHandlers,
  HANDLER_CONCURRENCY_COUNT,
  HandlerFunc,
  MissingServicePrivateKey,
  NotFound,
  parseOrderBy,
  web3Constants,
  ZERO,
} from '~common-service';
import { StatsData } from '~core';
import { Contract, ContractType, contractTypes, FContract, Network } from '~db';
import { services } from '~index';
import {
  CreateContractParams,
  GetBlockParams,
  GetBlockResponse,
  GetContractListParams,
  GetContractParams,
  GetMenageContractListResult,
  GetNetworkAddressesResponse,
  GetNetworkParams,
  GetPaymentGatewayTransactionItemsParams,
  GetPaymentGatewayTransactionItemsResponse,
  GetProRataNetDepositsParams,
  GetProRataNetDepositsResponse,
  GetProRataTransactionItemsParams,
  GetProRataTransactionItemsResponse,
  HandlerParams,
  UpdateContractParams,
} from '~types';
import { getCacheContractSettingKey, getContractData } from '~utils';

const cacheMachine = new CacheMachine();

const DEFAULT_CONTRACT_SORT = `${FContract('id')} ASC`;

const handlerFunc: HandlerFunc = () => ({
  actions: {
    ...commonHandlers,

    'network.addresses': {
      params: {
        network: { type: 'string' },
      } as HandlerParams<GetNetworkParams>,
      async handler(ctx: Context<GetNetworkParams>): Promise<GetNetworkAddressesResponse> {
        ctx.broker.logger.info(`web3.handler: network.addresses`);

        const network = checkIfNetwork(ctx?.params?.network);
        const result = getContractData(network);
        return result.sqrLaunchpadData;
      },
    },

    'network.blocks.id': {
      params: {
        network: { type: 'string' },
        id: { type: 'string' },
      } as HandlerParams<GetBlockParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<GetBlockResponse> {
        ctx.broker.logger.info(`web3.handler: network.blocks.id`);

        const network = checkIfNetwork(ctx?.params?.network);
        const paramId = ctx?.params.id;

        let id: string | number = paramId;
        if (paramId !== web3Constants.latest) {
          id = checkIfNumber(ctx?.params.id);
        }

        const block = await services.getProvider(network).getBlockByNumber(id);
        return {
          ...block,
          timestampDate: toDate(block.timestamp),
        };
      },
    },

    'indexer.network.stats': {
      params: {
        network: { type: 'string' },
      } as HandlerParams<GetNetworkParams>,
      async handler(ctx: Context<GetBlockParams>): Promise<StatsData> {
        ctx.broker.logger.info(`web3.handler: indexer.network.stats`);
        const network = checkIfNetwork(ctx.params.network);
        const [engineStats, servicesStats] = await Promise.all([
          services.multiSyncEngine.getStats(network),
          services.getStats(),
        ]);
        return { ...engineStats, ...servicesStats };
      },
    },

    'network.payment-gateway-contract.transaction-ids': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        transactionIds: { type: 'array', items: { type: 'string' } },
      } as HandlerParams<GetPaymentGatewayTransactionItemsParams>,
      async handler(
        ctx: Context<GetPaymentGatewayTransactionItemsParams>,
      ): Promise<GetPaymentGatewayTransactionItemsResponse[]> {
        const network = checkIfNetwork(ctx?.params?.network);
        const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
        const transactionIds = ctx?.params.transactionIds;

        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { getSqrPaymentGateway, getErc20Token } = context;

        const sqrPaymentGateway = getSqrPaymentGateway(contractAddress);

        return Bluebird.map(
          transactionIds,
          async (transactionId) => {
            const [transactionItem, erc20Decimals, dbPaymentGatewayTransactionItem] =
              await Promise.all([
                sqrPaymentGateway.fetchTransactionItem(transactionId),
                cacheMachine.call(
                  () => getCacheContractSettingKey(network, contractAddress),
                  async () => {
                    const tokenAddress = await getSqrPaymentGateway(contractAddress).erc20Token();
                    return getErc20Token(tokenAddress).decimals();
                  },
                ),
                services.dataStorage.getPaymentGatewayTransactionItemByTransactionId(transactionId),
              ]);

            const { amount } = transactionItem;

            const tx = dbPaymentGatewayTransactionItem?.transactionHash;
            if (amount !== ZERO) {
              return {
                transactionId,
                amount: toNumberDecimals(amount, erc20Decimals),
                tx,
                status: 'exists',
              };
            }

            return {
              transactionId,
              status: 'missing',
            };
          },
          { concurrency: HANDLER_CONCURRENCY_COUNT },
        );
      },
    },

    'network.pro-rata-contract.transaction-ids': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
        transactionIds: { type: 'array', items: { type: 'string' } },
      } as HandlerParams<GetProRataTransactionItemsParams>,
      async handler(
        ctx: Context<GetProRataTransactionItemsParams>,
      ): Promise<GetProRataTransactionItemsResponse[]> {
        const network = checkIfNetwork(ctx?.params?.network);
        const contractAddress = checkIfAddress(ctx?.params?.contractAddress);
        const transactionIds = ctx?.params.transactionIds;

        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { getSqrpProRata, getErc20Token } = context;

        const sqrPaymentGateway = getSqrpProRata(contractAddress);

        return Bluebird.map(
          transactionIds,
          async (transactionId) => {
            const [transactionItem, erc20Decimals, dbProRataTransactionItem] = await Promise.all([
              sqrPaymentGateway.fetchTransactionItem(transactionId),
              cacheMachine.call(
                () => getCacheContractSettingKey(network, contractAddress),
                async () => {
                  const tokenAddress = await getSqrpProRata(contractAddress).baseToken();
                  return getErc20Token(tokenAddress).decimals();
                },
              ),
              services.dataStorage.getProRataTransactionItemByTransactionId(transactionId),
            ]);

            const { amount } = transactionItem;

            const tx = dbProRataTransactionItem?.transactionHash;
            if (amount !== ZERO) {
              return {
                transactionId,
                amount: toNumberDecimals(amount, erc20Decimals),
                tx,
                status: 'exists',
              };
            }

            return {
              transactionId,
              status: 'missing',
            };
          },
          { concurrency: HANDLER_CONCURRENCY_COUNT },
        );
      },
    },

    'network.pro-rata-contract.net-deposits': {
      params: {
        network: { type: 'string' },
        contractAddress: { type: 'string' },
      } as HandlerParams<GetProRataNetDepositsParams>,
      async handler(
        ctx: Context<GetProRataNetDepositsParams>,
      ): Promise<GetProRataNetDepositsResponse[]> {
        const network = checkIfNetwork(ctx?.params?.network);
        const contractAddress = checkIfAddress(ctx?.params?.contractAddress);

        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { getSqrpProRata, getErc20Token } = context;

        const proRata = getSqrpProRata(contractAddress);
        const [accountCount, erc20Decimals] = await Promise.all([
          proRata.getAccountCount(),
          cacheMachine.call(
            () => getCacheContractSettingKey(network, contractAddress),
            async () => {
              const tokenAddress = await proRata.baseToken();
              return getErc20Token(tokenAddress).decimals();
            },
          ),
        ]);

        if (accountCount === ZERO) {
          return [];
        }

        return Bluebird.map(
          Array(Number(accountCount))
            .fill(0)
            .map((_, i) => i),
          async (idx: number) => {
            const account = await proRata.getAccountByIndex(idx);
            const accountInfo = await proRata.fetchAccountInfo(account);
            return {
              account,
              amount: toNumberDecimals(accountInfo.baseAllocation, erc20Decimals),
            };
          },
          { concurrency: HANDLER_CONCURRENCY_COUNT },
        );
      },
    },

    'indexer.hard-reset': {
      async handler(ctx: Context): Promise<void> {
        ctx.broker.logger.info(`web3.handler: indexer.hard-reset`);
        await services.multiSyncEngine.hardReset();
      },
    },

    'indexer.soft-reset': {
      async handler(ctx: Context): Promise<void> {
        ctx.broker.logger.info(`web3.handler: indexer.soft-reset`);
        await services.multiSyncEngine.softReset();
      },
    },

    'contract-types': {
      async handler() {
        return contractTypes;
      },
    },

    'networks.get-list': {
      async handler(): Promise<Network[]> {
        return services.dataStorage.getNetworks();
      },
    },

    'contracts.get-list': {
      params: {
        page: { type: 'string', optional: true },
        size: { type: 'string', optional: true },
        sort: { type: 'string', optional: true },
      } as HandlerParams<GetContractListParams>,
      async handler(ctx: Context<GetContractListParams>): Promise<GetMenageContractListResult> {
        const page = ctx?.params?.page ?? 1;
        const size = ctx?.params?.size ?? 10;
        const sort = ctx?.params?.sort ?? DEFAULT_CONTRACT_SORT;

        const [data, total] = await services.dataStorage.getContractsAndCountEx({
          offset: (page - 1) * size,
          limit: size,
          orderBy: parseOrderBy(sort, 'Contract'),
          notDisable: false,
        });

        return {
          data,
          total,
        };
      },
    },

    'contracts.get-item': {
      params: {
        id: { type: 'string', optional: true },
      } as HandlerParams<GetContractParams>,
      async handler(ctx: Context<GetContractParams>): Promise<Contract | null> {
        const id = ctx?.params?.id ?? 0;

        const contract = await services.dataStorage.getContract(id);

        if (!contract) {
          throw new NotFound();
        }

        return contract;
      },
    },

    'contracts.create-item': {
      params: {
        networkId: { type: 'number', optional: true },
        address: { type: 'string', optional: true },
        type: { type: 'string', optional: true },
        name: { type: 'string', optional: true },
        syncBlockNumber: { type: 'number', optional: true },
        processBlockNumber: { type: 'number', optional: true },
        disable: { type: 'boolean', optional: true },
      } as HandlerParams<CreateContractParams>,
      async handler(ctx: Context<CreateContractParams>): Promise<{
        data: Contract | null;
      } | null> {
        if (!ctx?.params) {
          return null;
        }

        const { networkId, address, type, name, syncBlockNumber, processBlockNumber, disable } =
          ctx.params;

        const contract = await services.dataStorage.createContract({
          networkId,
          address,
          type: type as ContractType,
          name,
          syncBlockNumber,
          processBlockNumber,
          disable,
        });

        return {
          data: contract,
        };
      },
    },

    'contracts.update-item': {
      params: {
        id: { type: 'string' },
        networkId: { type: 'number', optional: true },
        address: { type: 'string', optional: true },
        type: { type: 'string', optional: true },
        name: { type: 'string', optional: true },
        syncBlockNumber: { type: 'number', optional: true },
        processBlockNumber: { type: 'number', optional: true },
        disable: { type: 'boolean', optional: true },
      } as HandlerParams<UpdateContractParams>,
      async handler(ctx: Context<UpdateContractParams>): Promise<{
        data: Contract | null;
        updateResult: UpdateResult | null;
      } | null> {
        if (!ctx?.params) {
          return null;
        }

        const { id, networkId, address, type, name, syncBlockNumber, processBlockNumber, disable } =
          ctx.params;

        const updateResult = await services.dataStorage.updateContract(id, {
          networkId,
          address,
          type: type as ContractType,
          name,
          syncBlockNumber,
          processBlockNumber,
          disable,
        });

        const contract = await services.dataStorage.getContract(id);

        return {
          data: contract,
          updateResult,
        };
      },
    },

    'contracts.delete-item': {
      params: {
        id: { type: 'string', optional: true },
      } as HandlerParams<GetContractParams>,
      async handler(ctx: Context<GetContractParams>): Promise<DeleteResult | null> {
        const id = ctx?.params?.id ?? 0;

        const deleteResult = await services.dataStorage.deleteContract(id);

        if (!deleteResult) {
          throw new NotFound();
        }

        return deleteResult;
      },
    },
  },
});

module.exports = handlerFunc;
