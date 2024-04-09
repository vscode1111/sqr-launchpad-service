import { AxiosProxyConfig, AxiosRequestConfig } from 'axios';
import { config } from '../config';

// // Get proxy agent
// // TODO: import https-proxy-agent and http-proxy-agent
// // Info: https://www.npmjs.com/package/http-proxy-agent
// function getProxyAgent() {
//   if (config.proxy && config.proxy?.enabled) {
//     const proxyAuth = (config.proxy?.username && config.proxy?.password) ? `${config.proxy?.username}:${config.proxy?.password}@` : "";
//     const proxyAddress = `${config.proxy?.protocol || "http"}://${proxyAuth}${config.proxy?.host || "localhost"}:${config.proxy?.port || "3128"}`;
//     return config.proxy?.protocol === "https" ? new HttpsProxyAgent(proxyAddress) : new HttpProxyAgent(proxyAddress);
//   }
//   return {};
// }

export function getAxiosConfiguration(): AxiosRequestConfig {
  let proxy: AxiosProxyConfig | undefined = undefined;

  if (config?.proxy?.enabled) {
    proxy = {
      host: config.proxy.host,
      port: config.proxy.port,
      protocol: config.proxy.protocol,
      auth: {
        username: config.proxy.username,
        password: config.proxy.password,
      },
    };
  }

  return {
    proxy,
  };
}
