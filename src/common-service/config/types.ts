export interface BaseConfig {
  connections?: Connections;
  api: ApiConfig;
  auth?: AuthConfig;
  web3: Web3Config;
  integrations?: Integrations;
  protocol?: string;
  host?: string;
  logging?: Logging;
  serviceName?: string;
  applicationUpload?: string;
  taskListUrl?: string;
  magicIdService?: string;
  mailerService?: string;
  mainService?: string;
  karmaService?: string;
  crmService?: string;
  version?: string;
  proxy?: Proxy;
}

export interface Connections {
  transporter?: Transporter;
  pg?: PGConnection;
  redis?: RedisConnections;
  kafka?: KafkaConnections;
}

export interface ApiConfig {
  port?: number;
}

export interface AuthConfig {
  oktaDomain: string;
}

export interface Web3ConfigContract {
  address: string;
  blockNumber: number;
  type?: string;
  disable?: boolean;
}

export interface Web3Config {
  ownerPrivateKey: string;
  ownerAddress: string;
  sqrContractAddress: string;
  sharesThreshold: number;
  apiKey?: {
    bscScan?: string;
  };
  contracts: Record<string, Web3ConfigContract[]>;
  provider: Record<
    string,
    {
      http: string;
      wss: string;
      blockNumberFilterSize?: number;
      blockNumberRange?: number;
      blockNumberOffset?: number;
    }
  >;
  scheduler: {
    enable: boolean;
    syncRule: string;
  };
  kafka: {
    topicGroup: string;
    inTopic: string;
    inTokenTopic: string;
    outTopic: string;
    metricTopic: string;
  };
  vault?: {
    enable: boolean;
    url: string;
    token: string;
    baseRecord: string;
    ownerPrivateKeyRecord: string;
    role_id: string;
    secret_id: string;
  };
}

export interface RedisConnections {
  host?: string;
  port?: number;
}

export interface KafkaConnections {
  type?: string;
  options?: KafkaOptions;
  topics?: Record<string, number>;
}

export interface KafkaOptions {
  kafka?: OptionsKafka;
}

export interface OptionsKafka {
  brokers?: string[];
}

export interface PGConnection {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

export interface Transporter {
  type?: string;
  options?: TransporterOptions;
}

export interface TransporterOptions {
  urls?: string[];
}

export interface Integrations {
  zealy?: Zealy;
  sentry?: Sentry;
}

export interface Zealy {
  apiKey?: string;
  subdomain?: string;
}

export interface Sentry {
  enabled?: boolean;
}

export interface Logging {
  level?: string;
  type?: string;
}

export interface Proxy {
  enabled: boolean;
  host: string;
  port: number;
  protocol?: string;
  username: string;
  password: string;
}
