import { ApiRouteSchema } from 'moleculer-web';
import { commonRoutes, getApiPrefix, modifyRoutes } from '~common-service';

const apiPrefix = getApiPrefix();

export const routes: ApiRouteSchema[] = modifyRoutes([
  ...commonRoutes,
  {
    path: '/:network',
    aliases: {
      'GET addresses': `${apiPrefix}network.addresses`,
      'GET blocks/:id': `${apiPrefix}network.blocks.id`,
      'POST transaction-items': `${apiPrefix}network.transaction-items.transaction-ids`,
      'POST get-signature/withdraw': `${apiPrefix}network.get-signature.withdraw`,
    },
  },
  {
    path: '/indexer',
    aliases: {
      'GET :network/stats': `${apiPrefix}indexer.network.stats`,
      'DELETE hard-reset': `${apiPrefix}indexer.hard-reset`,
      'DELETE soft-reset': `${apiPrefix}indexer.soft-reset`,
    },
  },
  {
    path: '/security',
    aliases: {
      'GET status': `${apiPrefix}security.status`,
      'POST get-shares': `${apiPrefix}security.get-shares`,
      'POST send-share': `${apiPrefix}security.send-share`,
      'DELETE stop': `${apiPrefix}security.stop`,
    },
  },
]);
