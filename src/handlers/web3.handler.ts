import Bluebird from 'bluebird';
import { Context } from 'moleculer';
import { checkIfAddress, toNumberDecimals } from '~common';
import {
  CacheMachine,
  checkIfNetwork,
  commonHandlers,
  HANDLER_CONCURRENCY_COUNT,
  HandlerFunc,
  HandlerParams,
  MissingServicePrivateKey,
  ZERO,
} from '~common-service';
import { services } from '~index';
import {
  GetPaymentGatewayTransactionItemsParams,
  GetPaymentGatewayTransactionItemsResponse,
  GetProRataNetDepositsParams,
  GetProRataNetDepositsResponse,
  GetProRataTransactionItemsParams,
  GetProRataTransactionItemsResponse,
} from '~types';
import { getCacheContractSettingKey } from '~utils';

const cacheMachine = new CacheMachine();

const handlerFunc: HandlerFunc = () => ({
  actions: {
    ...commonHandlers,

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
  },
});

module.exports = handlerFunc;
