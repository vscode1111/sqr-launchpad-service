// const local = '192.168.0.14';
const local = 'localhost';

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
      mainnet: [
        {
          address: '0xc73F020ef7BF6EA2292a3B8545E21ef90340A4DD',
          blockNumber: 20634206,
          type: 'vesting',
          disable: true,
        },
      ],
      bsc: [
        {
          address: '0x5D27C778759e078BBe6D11A6cd802E41459Fe852',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0xe561e403093A19A770d5EE515aC1d5434275c026',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x8e6585Dd84c1cDc340727f66183992AaCe7Bfc18',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x88fD85b2621b6C9548A404eA250376AC5BEFeC13',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x48f4b9a3a95d97b62d1958dbd5bd3f906242a762',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x43e278854ae4a7b9b7dB7Dfb7cc7d60FEB2304f2',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x62608676F04AFe23554242Cfe09cEB84A2eb4287',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x1f7a0a34dFAdb7Fffd44af40e874C3bEd82430b1',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x274164619F412F6A8Aa68C80d8f95DBC2A6cC1bc',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x9c7Aea41B91f936d51f3BEA446b376E9D30d6758',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x566A3F53637AACc343800eCc2fE3a16A06e47704',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x5A422c2CF95Bd3f952848442086BAf554D471b8A',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x6e622319df441962a8aff93A7Ce8Bb4E5683A87E',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x11b045028DD6bcabD740c762a889306Dcc65Daa5',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0xEA425b1A5740c65AB3149E32d9043E0c20dd20d6',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x6FAd3a85e0D257183bA16F7cE31f5fDc6ac5c32c',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        // --------------
        {
          address: '0x30c526Ea466e35346685e410A04112422ee531CD',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x5696fa3DD95486590dAE95b9070b0760eF57BfCe',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        // Prod first sales
        {
          address: '0x73ee8C0cb385a663A411D306b7aa249b59c18d7d',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0xd4F4c2eE273c0F3611f7f93EA8e8eED4fef6906F',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0xf98844b0103a68E58B5ce99415879A1e30AFCAAC',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0x99518a992cC4d9c51f0ae4B269D45F4e9e33b0b2',
          blockNumber: 41700000,
          type: 'payment-gateway',
          disable: true,
        },
        /////
        {
          address: '0x741046cC8f0F680e716d99D1206DCF170FE9B5C2',
          blockNumber: 40690731,
          type: 'pro-rata',
          disable: true,
        },
        {
          address: '0x097F154bA5b83DA37a51752D9435b12EbE231689',
          blockNumber: 40777555,
          type: 'payment-gateway',
          disable: true,
        },
        {
          address: '0xFa05DdfE305a7425beB08F2A14E6B52C0Ab7D9B4',
          blockNumber: 41761100,
          type: 'vesting',
          disable: true,
        },
        {
          address: '0x2B09d47D550061f995A3b5C6F0Fd58005215D7c8',
          blockNumber: 42192786,
          type: 'babt',
          disable: true,
        },
      ],
    },
    provider: {
      mainnet: {
        http: 'https://rpc.ankr.com/eth/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e',
        blockNumberFilterSize: 0,
        blockNumberRange: 2000,
        blockNumberOffset: 10,
      },
      bsc: {
        http: 'https://rpc.ankr.com/bsc/0a92c9288ddd85181db59c48d2eae9d07873954be63e06893de5b4cbcb37842e',
        // http: 'https://bsc-dataseed.binance.org',
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
