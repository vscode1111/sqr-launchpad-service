const local = '192.168.0.14';
const { pg } = require('./secrets');

module.exports = {
  connections: {
    transporter: {
      type: 'NATS',
      options: {
        servers: [`${local}:4222`],
      },
    },
    pg: {
      ...pg,
      // host: `${local}`,
      // port: 5432,
      // user: 'postgres',
      // password: '461301+PG',
      // database: 'web3-indexer',
    },
    // redis: {
    //   host: '192.168.0.14',
    //   port: 6379,
    // },
    kafka: {
      type: 'Kafka',
      options: {
        kafka: {
          brokers: [`${local}:9092`],
          producerOptions: {},
          consumerOptions: {},
        },
      },
    },
  },
  web3: {
    provider: {
      bsc: {
        http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e', //MSQ
        // http: 'https://rpc.ankr.com/bsc/97b2f247bab0e3145e333a974d1df407868b284a76bbd0f3cf3755ac9eb2a89d', //Parser
        // http: 'https://rpc.ankr.com/bsc/2fca0ce2706df0eb00e4581d62960277b1bc59e3576eb0d1a447347784f0cb7c', //My
        // http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e', //WEB3
        blockNumberRange: 2000,
        blockNumberOffset: 10,
      },
    },
    scheduler: {
      enable: true,
      // syncRule: '* * * * *',
      syncRule: '*/30 * * * * *',
    },
    kafka: {
      outTopic: 'web3.indexer',
    },
    vault: {
      enable: false,
      url: 'http://127.0.0.1:8200',
      token: 'hvs.BvZIqprjR8qC42OVvr4GhdST',
      baseRecord: 'secret/data/web3-indexer-service',
      ownerPrivateKeyRecord: 'ownerPrivateKey',
    },
  },
  integrations: {
    zealy: {
      apiKey: '',
      subdomain: '',
    },
  },
  protocol: 'https',
  host: 'msq.siera.tech/',
  logging: {
    level: 'info',
    type: 'console',
  },
};
