import { computeAddress } from 'ethers';
import { ServiceBroker } from 'moleculer';
import sss from 'shamirs-secret-sharing';
import { Initilized, Stopped } from '~common';
import { SecurityStatusResponse, SecurityStatusType } from '../types';
import { logConsoleError, logConsoleInfo } from '../utils';

interface SecurityBlockerConfig {
  broker: ServiceBroker;
  privateKey: string;
  ownerAddress: string;
  threshold: number;
  onGetStatus: () => boolean;
  onStart: (privateKey: string) => Promise<void>;
  onStop: () => Promise<void>;
}

export class SecurityBlocker implements Initilized, Stopped {
  private status: SecurityStatusType;
  private shares: string[];

  constructor(private config: SecurityBlockerConfig) {
    this.status = 'waiting';
    this.shares = [];
  }

  getStatus(): SecurityStatusResponse {
    const serviceStatus = this.config.onGetStatus();

    return {
      status: serviceStatus ? 'running' : this.status,
      sharesCount: this.shares.length,
      sharesThreshold: this.config.threshold,
    };
  }

  async init() {
    if (!this.config.privateKey) {
      logConsoleError(this.config.broker, `Security. Service is waiting shares...`);
      return;
    }

    await this.config.onStart(this.config.privateKey);
  }

  async stop() {
    logConsoleInfo(this.config.broker, `Security. Service was stopped manually`);
    this.status = 'waiting';
    this.shares = [];
    await this.config.onStop();
    return this.getStatus();
  }

  getShares(secret: string, shares: number, threshold: number) {
    const bufferSecret = Buffer.from(secret);
    const bufferShares = sss.split(bufferSecret, { shares, threshold });
    return bufferShares.map((share) => share.toString('base64'));
  }

  async setShare(share: string) {
    this.shares.push(share);
    if (this.shares.length === this.config.threshold) {
      this.status = 'error';
      try {
        const bufferShares = this.shares.map((share) => Buffer.from(share, 'base64'));
        const privateKey = sss.combine(bufferShares).toString();

        const address = computeAddress(`0x${privateKey}`);

        if (address === this.config.ownerAddress) {
          logConsoleInfo(this.config.broker, 'Security. Service was started');
          await this.config.onStart(privateKey);
          this.status = 'running';
        }
      } catch (e) {
        console.error(e);
      }
    }
    return this.getStatus();
  }
}
