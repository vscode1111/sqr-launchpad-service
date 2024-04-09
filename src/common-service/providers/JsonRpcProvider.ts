import axios from 'axios';
import WebSocket from 'ws';
import { StringNumber, toDec, toHex, toTinyDec } from '~common';
import { Web3Block, Web3Event, Web3Receipt, Web3Transaction } from '../types';
import { getAxiosConfiguration } from '../utils';
import {
  JsonRpcBlock,
  JsonRpcEvent,
  JsonRpcReceipt,
  JsonRpcResponse,
  JsonRpcTransaction,
} from './JsonRpcProvider.types';
import { OnMessageFn, Provider } from './types';

// let counter = 0;

function getRequestBody(method: string, params: any[] = []) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: '1',
  };
}

function mapBlock(rpcBlock: JsonRpcBlock): Web3Block {
  return {
    number: toDec(rpcBlock.number),
    hash: rpcBlock.hash,
    timestamp: toDec(rpcBlock.timestamp),
  };
}

function mapEvent(rpcEvent: JsonRpcEvent): Web3Event {
  return {
    ...rpcEvent,
    blockNumber: toDec(rpcEvent.blockNumber),
    transactionIndex: toDec(rpcEvent.transactionIndex),
    logIndex: toDec(rpcEvent.logIndex),
  };
}

function mapTransaction(rpcTransaction: JsonRpcTransaction): Web3Transaction {
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

function mapReceipt(rpcReceipt: JsonRpcReceipt): Web3Receipt {
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

export class JsonRpcProvider implements Provider {
  private client: WebSocket | undefined;
  private onMessageFn: OnMessageFn | undefined;

  constructor(
    private rpcUrl: string,
    private wsUrl?: string,
  ) {}

  onMessage(fn: OnMessageFn) {
    this.onMessageFn = fn;
  }

  async subscribe(addresses: string[]) {
    if (!this.wsUrl?.includes('wss://')) {
      return;
    }

    this.client = new WebSocket(this.wsUrl);

    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject();
        return;
      }

      this.client.on('open', () => {
        for (const address of addresses) {
          this.client?.send(JSON.stringify(getRequestBody('eth_subscribe', ['logs', { address }])));
        }
        resolve(0);
      });

      this.client.on('message', async (message) => {
        const messageObj = JSON.parse(message.toString());
        if (this.onMessageFn) {
          await this.onMessageFn(messageObj);
        }
      });
    });
  }

  unsubscribe() {
    if (this.client?.readyState === 1) {
      this.client.close();
    }
  }

  async getBlockNumber() {
    // counter++;
    // console.log(111, counter);
    // if (counter === 3 || counter % 10 === 0) {
    //   // return 2049887477;
    //   return 'test' as any as number;
    // }

    const response = await axios.post(
      this.rpcUrl,
      getRequestBody('eth_blockNumber'),
      getAxiosConfiguration(),
    );
    return parseInt(response.data.result);
  }

  async getBlockByNumber(blockNumber: StringNumber) {
    let block = blockNumber;
    if (typeof blockNumber === 'number') {
      block = toHex(blockNumber);
    }

    const response = await axios.post(
      this.rpcUrl,
      getRequestBody('eth_getBlockByNumber', [block, false]),
      getAxiosConfiguration(),
    );
    return mapBlock(response.data.result);
  }

  async getEvents(address: string, fromBlock: number, toBlock: number) {
    // counter++;
    // console.log(111, counter);
    // if (counter === 3) {
    //   toBlock = 2049887477;
    // }

    const response = await axios.post<JsonRpcResponse<JsonRpcEvent[]>>(
      this.rpcUrl,
      getRequestBody('eth_getLogs', [
        {
          address,
          fromBlock: toHex(fromBlock),
          toBlock: toHex(toBlock),
        },
      ]),
      getAxiosConfiguration(),
    );
    return response.data.result.map(mapEvent);
  }

  async getTransactionByHash(hash: string) {
    const response = await axios.post<JsonRpcResponse<JsonRpcTransaction>>(
      this.rpcUrl,
      getRequestBody('eth_getTransactionByHash', [hash]),
      getAxiosConfiguration(),
    );
    return mapTransaction(response.data.result);
  }

  async getTransactionReceipt(hash: string) {
    const response = await axios.post<JsonRpcResponse<JsonRpcReceipt>>(
      this.rpcUrl,
      getRequestBody('eth_getTransactionReceipt', [hash]),
      getAxiosConfiguration(),
    );
    return mapReceipt(response.data.result);
  }
}
