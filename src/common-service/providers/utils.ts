import { parseError, toDec, toTinyDec } from '~common';
import { Web3Block, Web3Event, Web3Receipt, Web3Transaction } from '../types';
import {
  JsonRpcBlock,
  JsonRpcEvent,
  JsonRpcReceipt,
  JsonRpcResponse,
  JsonRpcTransaction,
} from './JsonRpcProvider.types';

export function getRequestBody(method: string, params: any[] = []) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: '1',
  };
}

export function mapBlock(rpcBlock: JsonRpcBlock): Web3Block {
  return {
    number: toDec(rpcBlock.number),
    hash: rpcBlock.hash,
    timestamp: toDec(rpcBlock.timestamp),
  };
}

export function mapEvent(rpcEvent: JsonRpcEvent): Web3Event {
  return {
    ...rpcEvent,
    blockNumber: toDec(rpcEvent.blockNumber),
    transactionIndex: toDec(rpcEvent.transactionIndex),
    logIndex: toDec(rpcEvent.logIndex),
  };
}

export function mapTransaction(rpcTransaction: JsonRpcTransaction): Web3Transaction {
  return {
    hash: rpcTransaction.hash,
    transactionIndex: toDec(rpcTransaction.transactionIndex),
    blockNumber: toDec(rpcTransaction.blockNumber),
    from: rpcTransaction.from,
    to: rpcTransaction.to,
    gas: toDec(rpcTransaction.gas),
    gasPrice: toTinyDec(rpcTransaction.gasPrice),
    input: rpcTransaction.input,
    nonce: toDec(rpcTransaction.nonce),
    value: toTinyDec(rpcTransaction.value),
  };
}

export function mapReceipt(rpcReceipt: JsonRpcReceipt): Web3Receipt {
  return {
    blockHash: rpcReceipt.blockHash,
    blockNumber: rpcReceipt.blockNumber,
    contractAddress: rpcReceipt.contractAddress,
    cumulativeGasUsed: toDec(rpcReceipt.cumulativeGasUsed),
    effectiveGasPrice: toTinyDec(rpcReceipt.effectiveGasPrice),
    from: rpcReceipt.from,
    to: rpcReceipt.to,
    gasUsed: toDec(rpcReceipt.gasUsed),
    status: toDec(rpcReceipt.status) === 1 ? 'success' : 'failure',
    transactionHash: rpcReceipt.transactionHash,
    transactionIndex: toDec(rpcReceipt.transactionIndex),
    type: toDec(rpcReceipt.type),
  };
}

export function processError<T>(data: JsonRpcResponse<T>) {
  if (data.error) {
    throw new Error(parseError(data.error));
  }
}
