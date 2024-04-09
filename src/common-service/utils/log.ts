// import { broker } from '~index';
import { ServiceBroker } from 'moleculer';

const isRunScript = process.env.RUN_SCRIPT || false;

export function logInfo(broker: ServiceBroker, ...msg: any[]) {
  // const date = dayjs().format("YYYY-MM-DD HH:mm:ss");
  // console.log(`[${date}]`, ...msg);

  if (isRunScript) {
    return;
  }

  // const { broker } = require('../index');
  broker?.logger.info(...msg);
}

export function logConsoleInfo(broker: ServiceBroker, ...msg: any[]) {
  logInfo(broker, ...msg);
  console.log(...msg);
}

export function logError(broker: ServiceBroker, ...msg: any[]) {
  if (isRunScript) {
    return;
  }

  // const { broker } = require('../index');
  broker?.logger.error(...msg);
}

export function logConsoleError(broker: ServiceBroker, ...msg: any[]) {
  logError(broker, ...msg);
  console.error(...msg);
}
