import axios from 'axios';
import https from 'https';
import { CreateAccountParams, CreateAccountResponse } from '~types';
import { services } from '..';
import { waitUntil } from '../common';
import { runConcurrently } from './utils';

const SRV_URL = 'http://localhost:3000';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function createAccount(userId: string): Promise<CreateAccountResponse | null> {
  const requestBody: CreateAccountParams = {
    userId,
  };

  try {
    const response = await axios.post<CreateAccountResponse>(`${SRV_URL}/account`, requestBody, {
      httpsAgent,
    });
    const { data } = response;

    return data;
  } catch (e) {
    console.error(e);
  }

  return null;
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

  it('check address', async () => {
    console.log('checking address...');

    await runConcurrently(
      async (taskId) => {
        const userId = `test-${taskId}`;
        // const userId = `test-001`;
        await createAccount(userId);
      },
      100_000,
      100,
      100,
    );
  });
});
