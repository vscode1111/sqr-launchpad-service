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
    ownerPrivateKey: 'f3c17fde54d9923e81dcc9dd4742a217b33c9f3885def8557f8989d6da72bded',
    contracts: {
      bsc: [
        // {
        //   address: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852', //Main
        //   blockNumber: 37764772,
        //   type: 'fcfs',
        // },
        // {
        //   address: '0xe561e403093A19A770d5EE515aC1d5434275c026', //Main
        //   blockNumber: 37966266,
        //   type: 'sqrp-gated',
        // },
        // {
        //   address: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18', //Main
        //   blockNumber: 37966320,
        //   type: 'white-list',
        // },
        // {
        //   address: '0x88fD85b2621b6C9548A404eA250376AC5BEFeC13', //Main
        //   blockNumber: 38106957,
        //   type: 'fcfs',
        // },
        {
          address: '0x48f4b9a3a95d97b62d1958dbd5bd3f906242a762', //Main
          blockNumber: 38193410,
          type: 'sqrp-gated',
        },
        {
          address: '0x4CfF5924b4B4C1cB6A02F1e1a542cc55A8bc6019', //Main
          blockNumber: 38594496,
          type: 'vesting',
        },
      ],
    },
    provider: {
      bsc: {
        http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e',
        blockNumberFilterSize: 0,
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
