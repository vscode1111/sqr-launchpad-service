module.exports = {
  connections: {
    transporter: {
      type: 'NATS',
      options: {
        urls: ['nats://10.90.34.73:32157'],
      },
    },
    pg: {
      host: '10.90.34.73',
      port: 30114,
      user: 'postgres',
      password: 'friCtVi5bM',
      // user: 'launchpad',
      // password: 'a966fb72ad83df61',
      database: 'launchpad',
    },
    // redis: {
    //   host: '192.168.0.14',
    //   port: 6379,
    // },
    kafka: {
      type: 'Kafka',
      options: {
        kafka: {
          brokers: ['10.90.34.73:32608'],
          producerOptions: {},
          consumerOptions: {},
        },
      },
    },
  },
  web3: {
    ownerPrivateKey: '59a2470b6db9b68d3b67f52bcd20e183d82df6f3579bd4699e7be2bd7d413827',
    provider: {
      bsc: {
        // http: "https://bsc.publicnode.com",
        http: 'https://rpc.ankr.com/bsc/2fca0ce2706df0eb00e4581d62960277b1bc59e3576eb0d1a447347784f0cb7c',
        // wss: "wss://bsc.publicnode.com",
        wss: '',
      },
    },
    scheduler: {
      enable: true,
      // syncRule: '* * * * *',
      syncRule: '*/30 * * * * *',
    },
    kafka: {
      outTopic: 'web3.launchpad',
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
