import { GetLaunchpadDepositSignatureParams } from '~types';

export interface TransactionStat {
  transactionId: string;
  tx?: string;
}

export type GetLaunchpadDepositSignatureParamsTest = Omit<
  GetLaunchpadDepositSignatureParams,
  'network'
>;
