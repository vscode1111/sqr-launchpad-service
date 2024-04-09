module.exports = {
  connections: {
    transporter: {
      type: 'NATS',
      options: {
        urls: ['nats://3.86.113.123'],
      },
    },
    pg: {
      host: 'magicstore-develop-dev.cxun069stzhq.us-east-1.rds.amazonaws.com',
      port: 5432,
      user: '',
      password: '',
      database: '',
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    kafka: {
      type: 'Kafka',
      options: { kafka: { brokers: ['127.0.0.1:9092'] } },
    },
  },
  protocol: 'https',
  host: 'msq.siera.tech/',
  logging: {
    level: 'info',
    type: 'console',
  },
};
