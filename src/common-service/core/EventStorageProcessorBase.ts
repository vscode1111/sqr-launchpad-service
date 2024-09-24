import { Interface } from 'ethers';
import { ServiceBroker } from 'moleculer';
import { DataSource } from 'typeorm';
import { EventNotifier } from '~common';
import { decodeInput } from '~common-back/utils';
import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';
import { Web3BusEvent } from '~types';
import { DeployNetworkKey } from '../types';
import { getTopic0 } from '../utils';
import { ServiceBrokerBase } from './ServiceBrokerBase';

export class EventStorageProcessorBase extends ServiceBrokerBase {
  protected topics0: string[];

  constructor(
    broker: ServiceBroker,
    protected dataSource: DataSource,
    protected network: DeployNetworkKey,
    protected eventNotifier: EventNotifier<Web3BusEvent>,
  ) {
    super(broker);
    this.topics0 = [];
  }

  async setTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>) {
    const topic0 = await getTopic0(filter);
    this.topics0.push(topic0);
    return topic0;
  }

  async setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  tryDecode<T>(
    transactionInput: string,
    abiInterfaces: Interface[],
    currentAbiInterface: Interface,
  ) {
    let error;

    try {
      return decodeInput<T>(transactionInput, currentAbiInterface);
    } catch (err: any) {
      error = err;
    }

    for (const abiInterface of abiInterfaces) {
      if (abiInterface === currentAbiInterface) {
        continue;
      }
      try {
        const result = decodeInput<T>(transactionInput, abiInterface);
        currentAbiInterface = abiInterface;
        return result;
      } catch (err: any) {
        error = err;
      }
    }
    throw error;
  }
}
