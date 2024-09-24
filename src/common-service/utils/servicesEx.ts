import { ApiRouteSchema } from 'moleculer-web';
import 'tsconfig-paths/register';
import { App } from '~core';
import { Services } from '~services';
import { checkBaseConfig } from '~utils';
import { config } from '../config';
import { bootstrapService } from './services';

checkBaseConfig(config);

export function bootstrapServiceEx(services: Services, routes: ApiRouteSchema[], channels: any) {
  bootstrapService(routes, channels, async (broker) => {
    services = new Services(broker);
    await services.init();
    const app = new App(services);
    await app.start();
    return services;
  });
}
