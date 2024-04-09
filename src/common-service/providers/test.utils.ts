import { expect } from 'chai';
import { commonTestValue, toDate } from '~common';
import { testData } from './testData';
import { Provider } from './types';

export const TEST_CONTACT = {
  address: '0xCE3B34160D2D2Dc391963D392AF2808df0ad6c44', //bsc
  blockNumber: 41364055,
  blockNumberMax: 40536829,
};

export function providerTests(provider: Provider) {
  afterEach(async function () {
    provider?.unsubscribe();
  });

  it('check getBlockNumber', async function () {
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber).greaterThan(testData.minBlockNumber);
  }).timeout(commonTestValue.timeout);

  it('check getBlockByNumber', async function () {
    const block = await provider.getBlockByNumber(testData.blockNumber);
    expect(block.number).eq(testData.blockNumber);
    expect(block.hash).eq('0xa053132af16c9afdb30561deb6cdd1260770ab494d7e25432e5ade033ad44657');
    expect(toDate(block.timestamp).getFullYear()).eq(2023);
  }).timeout(commonTestValue.timeout);

  it.skip('check getEvents', async function () {
    const events = await provider.getEvents(TEST_CONTACT.address, 40676528, 40677529);
    expect(events.length).eq(7);
    const firstEvent = events[0];
    expect(firstEvent.blockNumber).eq(40677177);
    expect(firstEvent.transactionIndex).eq(53);
    expect(firstEvent.logIndex).eq(176);
  }).timeout(commonTestValue.timeout);

  it('check getTransactionByHash', async function () {
    const transaction = await provider.getTransactionByHash(testData.transactionHash);
    expect(transaction.blockNumber).eq(40713342);
    expect(transaction.transactionIndex).eq(76);
    expect(transaction.gas).eq(100000);
    expect(transaction.input).eq('0xd0e30db0');
    expect(transaction.value).eq(0.5);
  }).timeout(commonTestValue.timeout);

  it.skip('check subscription', async function () {
    await provider.subscribe([]);

    return new Promise((resolve) => {
      provider.onMessage((blockNumber) => {
        expect(blockNumber).greaterThan(testData.minBlockNumber);
        resolve();
      });
    });
  }).timeout(commonTestValue.timeout);
}
