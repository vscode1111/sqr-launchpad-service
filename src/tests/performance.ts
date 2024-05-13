import appRoot from 'app-root-path';
import axios from 'axios';
import { expect } from 'chai';
import { readFileSync, writeFileSync } from 'fs';
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { convertArray2DToContent, convertContentToArray2D, waitTxEx, waitUntil } from '~common';
import { DeployNetworkKey, MissingServicePrivateKey, ZERO } from '~common-service';
import { services } from '~index';
import {
  GetSignatureDepositResponse,
  GetTransactionItemsParams,
  GetTransactionItemsResponse,
} from '~types';
import { GetLaunchpadDepositSignatureParamsTest, TransactionStat } from './types';
import { runConcurrently, txOverrides } from './utils';

const root = appRoot.toString();

// const SRV_URL = 'https://sqr.main.dev.msq.local/signature/api';
const SIGNATURE_URL = 'https://sqr.stage.msq.local/signature/api';

const LAUNCHPAD_URL = 'https://sqr.main.dev.msq.local/launchpad/api';

const TEST_CASE_SEND = false;
const txAmount = 1000;
const checkDbFileName = 1714678456369;

const NETWORK: DeployNetworkKey = 'bsc';

const CONTRACT_ADDRESS = '0x5D27C778759e078BBe6D11A6cd802E41459Fe852';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function getSignature(
  requestBody: GetLaunchpadDepositSignatureParamsTest,
): Promise<GetSignatureDepositResponse | null> {
  const response = await axios.post<GetSignatureDepositResponse>(
    `${SIGNATURE_URL}/bsc/launchpad/deposit-signature`,
    // `${SRV_URL}/bsc/launchpad/deposit-signature-instant`,
    requestBody,
    {
      httpsAgent,
    },
  );
  const { data } = response;

  return data;
}

async function getIndexerTransactionItems(
  transactionIds: string[],
): Promise<GetTransactionItemsResponse> {
  const requestBody: Omit<GetTransactionItemsParams, 'network'> = {
    contractType: 'fcfs',
    contractAddress: CONTRACT_ADDRESS,
    transactionIds,
  };

  const response = await axios.post<GetTransactionItemsResponse[]>(
    `${LAUNCHPAD_URL}/bsc/transaction-items`,
    requestBody,
    { httpsAgent },
  );
  const { data } = response;

  return data[0];
}

describe('performance', () => {
  beforeEach(async function () {
    if (!services?.isStarted) {
      await services?.start();
    }
    await waitUntil(() => services?.isStarted);
  });

  afterEach(async function () {
    await services?.stop();
  });

  it('send transactions', async () => {
    if (!TEST_CASE_SEND) {
      return;
    }

    console.log('send transactions...');

    const context = services.getNetworkContext(NETWORK);
    if (!context) {
      throw new MissingServicePrivateKey();
    }

    const { getSqrPaymentGateway, rawProvider, owner } = context;
    const sqrLaunchpad = getSqrPaymentGateway(CONTRACT_ADDRESS);

    const paymentGatewayTransactionItems: TransactionStat[] = [];

    const txCount = await rawProvider.getTransactionCount(owner);

    console.log(`Sending transactions txCount: ${txCount}...`);

    await runConcurrently(
      async (taskId) => {
        const requestBody: GetLaunchpadDepositSignatureParamsTest = {
          // userId: 'tu1-f75c73b1-0f13-46ae-88f8-2048765c5ad4',
          // transactionId: 'b7ae3413-1ccb-42d0-9edf-86e9e6d6953t+06',
          contractType: 'fcfs',
          contractAddress: CONTRACT_ADDRESS,
          userId: uuidv4(),
          transactionId: uuidv4(),
          account: owner.address,
          amount: taskId * 0.0001,
        };

        const response = await getSignature(requestBody);

        if (!response) {
          throw 'no signature response';
        }

        const { signature, amountInWei, timestampLimit } = response;

        const tx = await waitTxEx(
          sqrLaunchpad.depositSig(
            requestBody.userId,
            requestBody.transactionId,
            requestBody.account,
            BigInt(amountInWei ?? '0'),
            timestampLimit ?? 0,
            signature,
            {
              nonce: txCount + taskId,
              ...txOverrides,
            },
          ),
          { skipWait: true },
        );

        paymentGatewayTransactionItems.push({
          transactionId: requestBody.transactionId,
          tx: tx?.hash ?? '',
        });
      },
      txAmount,
      100,
      100,
    );

    if (paymentGatewayTransactionItems.length > 0) {
      const fileName = new Date().getTime();
      const targetPath = `${root}/temp/${fileName}.txt`;

      writeFileSync(
        targetPath,
        convertArray2DToContent(
          paymentGatewayTransactionItems.map((item) => [item.transactionId, item.tx ?? '']),
        ),
      );
    }
  });

  it('check db', async () => {
    if (TEST_CASE_SEND) {
      return;
    }

    console.log('checking db...');

    const targetPath = `${root}/temp/${checkDbFileName}.txt`;

    const content = readFileSync(targetPath, 'utf8');
    const transactionIds = convertContentToArray2D(content);

    const context = services.getNetworkContext(NETWORK);
    if (!context) {
      return;
    }

    const { getSqrPaymentGateway } = context;
    const sqrLaunchpad = getSqrPaymentGateway(CONTRACT_ADDRESS);

    let foundCountInDb = 0;
    const notFoundInDbList: TransactionStat[] = [];

    let foundCountInContract = 0;
    const notFoundInDbContract: TransactionStat[] = [];

    await runConcurrently(
      async (taskId) => {
        const [transactionId, tx] = transactionIds[taskId];

        // const transactionItemInDb = await services.dataStorage.getTransactionItem(transactionId);
        const transactionItemInService = await getIndexerTransactionItems([transactionId]);
        if (transactionItemInService?.tx) {
          foundCountInDb++;
        } else {
          notFoundInDbList.push({ transactionId, tx });
        }

        const [amount] = await sqrLaunchpad.fetchTransactionItem(transactionId);
        if (amount !== ZERO) {
          foundCountInContract++;
        } else {
          notFoundInDbContract.push({ transactionId, tx });
        }
      },
      transactionIds.length,
      100,
      10,
    );

    console.log(`Result: ${foundCountInDb}, ${foundCountInContract} => ${transactionIds.length}`);
    // console.log('notFoundInDbList', notFoundInDbList);
    console.log('notFoundInDbContract', notFoundInDbContract.slice(0, 5));
    expect(foundCountInDb).eq(transactionIds.length);
  });
});
