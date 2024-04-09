global.ENV = process.env.NODE_ENV || 'dev';
global.WATCH = process.env.WATCH || false;
global.BUILD = process.env.BUILD;

// eslint-disable-next-line no-console
console.log('TCL: WATCH', global.WATCH);
// eslint-disable-next-line no-console
console.log('TCL: ENV', global.ENV);
// eslint-disable-next-line no-console
console.log('TCL: BUILD', global.BUILD);

const path = require('path');

const environmentConfig = require(path.join(__dirname, global.ENV, 'config'));

const commonConfig = {
  version: 'sqr-test',
  serviceName: 'sqr-launchpad-service',
  applicationUpload: 'application-uploader',
  taskListUrl: 'profile/validation-tasks/',
  magicIdService: 'magicid',
  mailerService: 'mailer',
  mainService: 'main',
  karmaService: 'karma',
  crmService: 'crm',
};

const config = {
  ...environmentConfig,
  ...commonConfig,
};

module.exports = config;
