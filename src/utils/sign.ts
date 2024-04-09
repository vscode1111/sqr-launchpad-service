import { Wallet } from 'ethers';
import { signMessage } from '~common';

export async function signMessageForWithdraw(
  signer: Wallet,
  userId: string,
  transactionId: string,
  to: string,
  amount: bigint,
  timestampLimit: number,
) {
  return signMessage(
    signer,
    // userId,  transactionId,  to, amount,   timestampLimit
    ['string', 'string', 'address', 'uint256', 'uint32'],
    [userId, transactionId, to, amount, timestampLimit],
  );
}
