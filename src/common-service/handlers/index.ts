import { ActionSchema, Context } from 'moleculer';

export const commonHandlers: Record<string, ActionSchema> = {
  version: {
    async handler(ctx: Context) {
      ctx.broker.logger.info(`web3.handler: version`);

      return {
        name: process.env.npm_package_name,
        version: process.env.npm_package_version,
      };
    },
  },
};
