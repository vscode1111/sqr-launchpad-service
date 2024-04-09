import { JsonRpcProvider } from './JsonRpcProvider';
import { providerTests } from './test.utils';

const ALCHEMY_KEY = 'LDnmyD6eJX35w-rXMniNBngEc1BpuXVQ';

describe('JsonRpcProvider', () => {
  providerTests(
    new JsonRpcProvider(
      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      `wss://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    ),
  );
});
