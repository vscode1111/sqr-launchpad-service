import 'tsconfig-paths/register';
import { routes } from '~api';
import { bootstrapService, config } from '~common-service';
import { App } from '~core';
import { Services } from '~services';
import { checkBaseConfig } from '~utils';

checkBaseConfig(config);

export let services: Services;

bootstrapService(routes, undefined, async (broker) => {
  services = new Services(broker);
  await services.init();
  const app = new App(services);
  await app.start();
  return services;
});
