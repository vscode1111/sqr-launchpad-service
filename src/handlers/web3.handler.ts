import Bluebird from 'bluebird';
import { Context } from 'moleculer';
import { checkIfNumber, toDate, toNumberDecimals } from '~common';
import {
  HANDLER_CONCURRENCY_COUNT,
  HandlerFunc,
  MissingServicePrivateKey,
  ZERO,
  checkIfContractType,
  checkIfNetwork,
  commonHandlers,
  getChainConfig,
  web3Constants,
} from '~common-service';
import { StatsData } from '~core';
import { services } from '~index';
import {
  GetBlockParams,
  GetBlockResponse,
  GetNetworkAddressesResponse,
  GetNetworkParams,
  GetTransactionItemsParams,
  GetTransactionItemsResponse,
  HandlerParams,
} from '~types';
import { getContractData } from '~utils';

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

    'network.transaction-items.transaction-ids': {
      params: {
        network: { type: 'string' },
        contractType: { type: 'string' },
        transactionIds: { type: 'array', items: { type: 'string' } },
      } as HandlerParams<GetTransactionItemsParams>,
      async handler(
        ctx: Context<GetTransactionItemsParams>,
      ): Promise<GetTransactionItemsResponse[]> {
        const network = checkIfNetwork(ctx?.params?.network);
        const contractType = checkIfContractType(ctx?.params?.contractType);
        const transactionIds = ctx?.params.transactionIds;

        const context = services.getNetworkContext(network);
        if (!context) {
          throw new MissingServicePrivateKey();
        }

        const { sqrLaunchpads, contractTypeMap } = context;
        const { sqrDecimals } = getChainConfig(network);

        const contractAddress = contractTypeMap[contractType][0];
        const sqrLaunchpad = sqrLaunchpads[contractAddress];

        return Bluebird.map(
          transactionIds,
          async (transactionId) => {
            const [amount] = await sqrLaunchpad.fetchTransactionItem(transactionId);

            if (amount !== ZERO) {
              const result: GetTransactionItemsResponse = {
                transactionId,
                amount: toNumberDecimals(amount, sqrDecimals),
                status: 'exists',
              };
              return result;
            }

            const result: GetTransactionItemsResponse = {
              transactionId,
              status: 'missing',
            };
            return result;
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
  },
});

module.exports = handlerFunc;
