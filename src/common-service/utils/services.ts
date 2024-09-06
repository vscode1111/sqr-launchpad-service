import Moleculer, { ServiceBroker } from 'moleculer';
import ApiService, { ApiRouteSchema } from 'moleculer-web';
import { buildBroker, mixins } from 'msq-moleculer-core';
import path from 'path';
import { parseError, parseStack } from '~common';
import { cors } from '../api';
import { config } from '../config';
import { ServicesBase } from '../core';
import { logConsoleError, logConsoleInfo } from '../utils';

export async function bootstrapService<T extends ServicesBase>(
  routes: ApiRouteSchema[],
  channels: any,
  startFn: (
    broker: ServiceBroker,
    moleculerService: Moleculer.Service<Moleculer.ServiceSettingSchema>,
  ) => Promise<T>,
): Promise<{
  broker: ServiceBroker;
  services: T;
}> {
  const broker = buildBroker(config);
  const srcPath = path.join(__dirname, '../..');
  const moleculerService = broker.createService({
    name: config.serviceName ?? '',
    version: config.version,
    mixins: [mixins.LoadHandler(`${srcPath}/handlers/`, broker), ApiService],
    settings: {
      port: config.api?.port ?? 3000,
      cors,
      routes,
    },
    channels,
  });

  logConsoleInfo(broker, `Service is running...`);

  let services: T = {} as any;

  try {
    services = await startFn(broker, moleculerService);
    catchAllExceptions(broker, services);
    await broker.start();
  } catch (err) {
    console.error(err);
    broker.logger.error(`Start failed ${err} in ${parseStack(err)}`);
    broker.stop();
  }

  return {
    broker,
    services,
  };
}

export function catchAllExceptions(broker: ServiceBroker, services: ServicesBase) {
  process.on('uncaughtException', function (err) {
    try {
      const errorCount = services?.saveProcessError(err) ?? -1;
      logConsoleError(
        broker,
        `Process caught exception #${errorCount}: ${parseError(err)} in ${parseStack(err)}`,
        err,
      );
    } catch (err: any) {}
  });
}
