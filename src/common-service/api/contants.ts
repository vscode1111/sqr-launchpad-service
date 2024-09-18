import { ApiRouteSchema, CorsOptions } from 'moleculer-web';
import { getApiPrefix, modifyRoutes } from './utils';

// Global CORS settings for all routes
export const cors: CorsOptions = {
  // Configures the Access-Control-Allow-Origin CORS header.
  origin: '*',
  // Configures the Access-Control-Allow-Methods CORS header.
  methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
  // Configures the Access-Control-Allow-Headers CORS header.
  // allowedHeaders: [],
  // Configures the Access-Control-Expose-Headers CORS header.
  exposedHeaders: [],
  // Configures the Access-Control-Allow-Credentials CORS header.
  credentials: false,
  // Configures the Access-Control-Max-Age CORS header.
  maxAge: 3600,
};

const apiPrefix = getApiPrefix();

export const commonRoutes: ApiRouteSchema[] = modifyRoutes([
  {
    path: '/',
    aliases: {
      'GET version': `${apiPrefix}version`,
      'DELETE reboot': `${apiPrefix}reboot`,
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
  {
    path: '/db',
    aliases: {
      'GET contract-types': `${apiPrefix}contract-types`,
      'GET networks': `${apiPrefix}networks.get-list`,
      'GET contracts': `${apiPrefix}contracts.get-list`,
      'GET contracts/:id': `${apiPrefix}contracts.get-item`,
      'POST contracts': `${apiPrefix}contracts.create-item`,
      'PUT contracts/:id': `${apiPrefix}contracts.update-item`,
      'DELETE contracts/:id': `${apiPrefix}contracts.delete-item`,
    },
  },
]);
