import axios from 'axios';
import WebSocket from 'ws';
import { StringNumber, toHex } from '~common';
import { getAxiosConfiguration } from '../utils/axios';
import {
  JsonRpcEvent,
  JsonRpcReceipt,
  JsonRpcResponse,
  JsonRpcTransaction,
} from './JsonRpcProvider.types';
import { OnMessageFn, Provider } from './types';
import {
  getRequestBody,
  mapBlock,
  mapEvent,
  mapReceipt,
  mapTransaction,
  processError,
} from './utils';

// let counter = 0;

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

    const { data } = await axios.post(
      this.rpcUrl,
      getRequestBody('eth_blockNumber'),
      getAxiosConfiguration(),
    );
    processError(data);
    return parseInt(data.result);
  }

  async getBlockByNumber(blockNumber: StringNumber) {
    let block = blockNumber;
    if (typeof blockNumber === 'number') {
      block = toHex(blockNumber);
    }

    const { data } = await axios.post(
      this.rpcUrl,
      getRequestBody('eth_getBlockByNumber', [block, false]),
      getAxiosConfiguration(),
    );
    processError(data);
    return mapBlock(data.result);
  }

  async getEvents(address: string, fromBlock: number, toBlock: number) {
    // counter++;
    // console.log(111, counter);
    // if (counter === 3) {
    //   toBlock = 2049887477;
    // }

    const { data } = await axios.post<JsonRpcResponse<JsonRpcEvent[]>>(
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
    processError(data);
    return data.result.map(mapEvent);
  }

  async getTransactionByHash(hash: string) {
    const { data } = await axios.post<JsonRpcResponse<JsonRpcTransaction>>(
      this.rpcUrl,
      getRequestBody('eth_getTransactionByHash', [hash]),
      getAxiosConfiguration(),
    );
    processError(data);
    return mapTransaction(data.result);
  }

  async getTransactionReceipt(hash: string) {
    const { data } = await axios.post<JsonRpcResponse<JsonRpcReceipt>>(
      this.rpcUrl,
      getRequestBody('eth_getTransactionReceipt', [hash]),
      getAxiosConfiguration(),
    );
    processError(data);
    return mapReceipt(data.result);
  }
}
