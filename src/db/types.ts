import { Repository } from 'typeorm';
import { NF } from '~common';
import { DeployNetworkKey } from '~common-service';
import { Contract, Network } from '~db';

export type OrderType = 'ASC' | 'DESC';

export interface OrderByParams {
  sort: string;
  order?: OrderType;
}

export interface FindContractsParamsBase {
  network?: DeployNetworkKey;
  notDisable?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: OrderByParams;
}

export interface FindContractsParams extends FindContractsParamsBase {
  contractRepository: Repository<Contract>;
  networkRepository: Repository<Network>;
}

export interface FindContractParams {
  id: number;
  contractRepository: Repository<Contract>;
}

export const NFindContractsParams = NF<FindContractsParams>();
