import { ApiRouteSchema } from 'moleculer-web';
import { config } from '../config';

function flattenRoutes(routes: ApiRouteSchema[]): ApiRouteSchema[] {
  const routeMap: Map<string, ApiRouteSchema> = new Map();

  for (const route of routes) {
    const key = route.path;
    const routeCached = routeMap.get(key);
    if (!routeCached) {
      routeMap.set(key, route);
    } else {
      routeCached.aliases = { ...routeCached.aliases, ...route.aliases };
    }
  }

  return [...routeMap].map(([_, value]) => value);
}

export function modifyRoutes(routes: ApiRouteSchema[]): ApiRouteSchema[] {
  const newRoutes = flattenRoutes(routes);
  return newRoutes.map((route) => ({ logging: false, ...route }));
}

export function getApiPrefix() {
  let result = '';
  if (config.version) {
    result += `${config.version}.`;
  }
  if (config.serviceName) {
    result += `${config.serviceName}.`;
  }
  return result;
}
