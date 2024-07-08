import { ActionSchema, Context } from 'moleculer';

export const commonHandlers: Record<string, ActionSchema> = {
  version: {
    async handler(_: Context) {
      return {
        name: process.env.npm_package_name,
        version: process.env.npm_package_version,
      };
    },
  },
};
