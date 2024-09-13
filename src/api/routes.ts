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
      'POST payment-gateway-contract/transaction-items': `${apiPrefix}network.payment-gateway-contract.transaction-ids`,
      'POST pro-rata-contract/transaction-items': `${apiPrefix}network.pro-rata-contract.transaction-ids`,
      'POST pro-rata-contract/net-deposits': `${apiPrefix}network.pro-rata-contract.net-deposits`,
    },
  },
]);
