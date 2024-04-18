const local = '192.168.0.195';

module.exports = {
  connections: {
    transporter: {
      type: 'NATS',
      options: {
        servers: [`${local}:4222`],
      },
    },
    pg: {
      host: `${local}`,
      port: 5432,
      user: 'postgres',
      password: '461301+PG',
      database: 'sqr-launchpad',
    },
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
  proxy: {
    enabled: false,
    host: 'proxy.msq.local',
    port: 3128,
    protocol: 'http',
    username: 'develop',
    password: 'znhcf94oi0arlz8q',
  },
  web3: {
    contracts: {
      bsc: [
        {
          address: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main
          blockNumber: 37764772,
          type: 'fcfs',
        },
        {
          address: '0xe561e403093A19A770d5EE515aC1d5434275c026', //Main
          blockNumber: 37966266,
          type: 'sqrp-gated',
        },
        {
          address: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18', //Main
          blockNumber: 37966320,
          type: 'white-list',
        },
      ],
    },
    provider: {
      bsc: {
        http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e',
        blockNumberfilterSize: 0,
        blockNumberRange: 2000,
        blockNumberOffset: 10,
      },
    },
    scheduler: {
      enable: true,
      // syncRule: '* * * * *',
      // syncRule: '*/30 * * * * *',
      syncRule: '*/5 * * * * *',
    },
    kafka: {
      outTopic: 'web3.launchpad',
    },
    vault: {
      enable: false,
      url: 'http://127.0.0.1:8200',
      token: 'hvs.BvZIqprjR8qC42OVvr4GhdST',
      baseRecord: 'secret/data/sqr-launchpad-service',
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
