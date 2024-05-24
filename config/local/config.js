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
        {
          address: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852',
          blockNumber: 37764772,
          type: 'fcfs',
          disable: true,
        },
        {
          address: '0xe561e403093A19A770d5EE515aC1d5434275c026',
          blockNumber: 37966266,
          type: 'sqrp-gated',
        },
        {
          address: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18',
          blockNumber: 37966320,
          type: 'white-list',
        },
        {
          address: '0x88fD85b2621b6C9548A404eA250376AC5BEFeC13',
          blockNumber: 38106957,
          type: 'fcfs',
        },
        {
          address: '0x48f4b9a3a95d97b62d1958dbd5bd3f906242a762',
          blockNumber: 38193410,
          type: 'sqrp-gated',
        },
        {
          address: '0x43e278854ae4a7b9b7dB7Dfb7cc7d60FEB2304f2',
          blockNumber: 38573856,
          type: 'fcfs',
        },
        {
          address: '0x62608676F04AFe23554242Cfe09cEB84A2eb4287',
          blockNumber: 38574300,
          type: 'fcfs',
        },
        {
          address: '0x1f7a0a34dFAdb7Fffd44af40e874C3bEd82430b1',
          blockNumber: 38594594,
          type: 'fcfs',
        },
        {
          address: '0x274164619F412F6A8Aa68C80d8f95DBC2A6cC1bc',
          blockNumber: 38594878,
          type: 'white-list',
        },
        {
          address: '0x9c7Aea41B91f936d51f3BEA446b376E9D30d6758',
          blockNumber: 38595001,
          type: 'sqrp-gated',
        },
        {
          address: '0x566A3F53637AACc343800eCc2fE3a16A06e47704',
          blockNumber: 38685280,
          type: 'fcfs',
        },
        {
          address: '0x5A422c2CF95Bd3f952848442086BAf554D471b8A',
          blockNumber: 38685466,
          type: 'sqrp-gated',
        },
        {
          address: '0x6e622319df441962a8aff93A7Ce8Bb4E5683A87E',
          blockNumber: 38685593,
          type: 'white-list',
        },
        {
          address: '0x11b045028DD6bcabD740c762a889306Dcc65Daa5',
          blockNumber: 38708145,
          type: 'white-list',
        },
        {
          address: '0xEA425b1A5740c65AB3149E32d9043E0c20dd20d6',
          blockNumber: 38709539,
          type: 'sqrp-gated',
        },
        {
          address: '0x6FAd3a85e0D257183bA16F7cE31f5fDc6ac5c32c',
          blockNumber: 38710059,
          type: 'fcfs',
        },
        {
          address: '0x3554A27F8e0869fE568DcF3ebE922Ce9200e16BE',
          blockNumber: 38801527,
          type: 'vesting',
        },
        {
          address: '0x872D661B0840aA486f851D806A7b43aC701A660a',
          blockNumber: 38970368,
          type: 'fcfs',
        },
        {
          address: '0xc0ad64F1FBdeCc0F5855307fcB5f3e24fbb9E543',
          blockNumber: 38970509,
          type: 'sqrp-gated',
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
