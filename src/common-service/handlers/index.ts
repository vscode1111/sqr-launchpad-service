import { ActionSchema, Context } from 'moleculer';
import { DeleteResult, UpdateResult } from 'typeorm';
import { checkIfNumber, toDate } from '~common';
import { Contract, ContractType, contractTypes, FContract, Network } from '~db';
import { services } from '~index';
import { web3Constants } from '../constants';
import { parseOrderBy } from '../db';
import { NotFound } from '../libs';
import { GetSecuritySharesParams, SetSecurityShareParams, StatsData } from '../types';
import { checkIfNetwork } from '../utils';
import {
  CreateContractParams,
  GetBlockParams,
  GetBlockResponse,
  GetContractListParams,
  GetContractParams,
  GetMenageContractListResult,
  GetNetworkParams,
  HandlerParams,
  UpdateContractParams,
} from './types';

export * from './types';

const DEFAULT_CONTRACT_SORT = `${FContract('id')} ASC`;

export const commonHandlers: Record<string, ActionSchema> = {
  version: {
    async handler(_: Context) {
      return {
        name: process.env.npm_package_name,
        version: process.env.npm_package_version,
      };
    },
  },

  reboot: {
    async handler(_: Context): Promise<void> {
      services.reboot();
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

  'security.status': {
    async handler() {
      return services.securityBlocker.getStatus();
    },
  },

  'security.get-shares': {
    params: {
      secret: { type: 'string' },
      shares: { type: 'number' },
      threshold: { type: 'number' },
    } as HandlerParams<GetSecuritySharesParams>,
    async handler(ctx: Context<GetSecuritySharesParams>) {
      const { secret, shares, threshold } = ctx?.params;
      return services.securityBlocker.getShares(secret, shares, threshold);
    },
  },

  'security.send-share': {
    params: {
      share: { type: 'string' },
    } as HandlerParams<SetSecurityShareParams>,
    async handler(ctx: Context<SetSecurityShareParams>) {
      const { share } = ctx?.params;
      return services.securityBlocker.setShare(share);
    },
  },

  'security.stop': {
    async handler() {
      return services.securityBlocker.stop();
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
};
