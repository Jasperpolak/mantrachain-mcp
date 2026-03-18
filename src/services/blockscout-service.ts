import { NetworkConfig } from '../config.js';

export class BlockscoutService {
  private baseUrl: string;

  constructor(network: NetworkConfig) {
    if (!network.blockscoutEndpoint) {
      throw new Error('Blockscout endpoint not configured for this network');
    }
    this.baseUrl = network.blockscoutEndpoint.replace(/\/+$/, '');
  }

  private async fetchJson(path: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  private buildPageParams(pageParams?: Record<string, string>): string {
    if (!pageParams || Object.keys(pageParams).length === 0) return '';
    const qs = new URLSearchParams(pageParams).toString();
    return `&${qs}`;
  }

  async getAddressTransactions(address: string, pageParams?: Record<string, string>) {
    const path = `/addresses/${address}/transactions?${this.buildPageParams(pageParams)}`;
    return this.fetchJson(path);
  }

  async getAddressTokens(address: string, pageParams?: Record<string, string>) {
    const path = `/addresses/${address}/tokens?${this.buildPageParams(pageParams)}`;
    return this.fetchJson(path);
  }

  async getAddressTokenTransfers(address: string, options?: { token?: string; type?: string }, pageParams?: Record<string, string>) {
    let path = `/addresses/${address}/token-transfers?`;
    if (options?.token) path += `token=${options.token}&`;
    if (options?.type) path += `type=${options.type}&`;
    path += this.buildPageParams(pageParams);
    return this.fetchJson(path);
  }

  async getTokenHolders(contractAddress: string, pageParams?: Record<string, string>) {
    const path = `/tokens/${contractAddress}/holders?${this.buildPageParams(pageParams)}`;
    return this.fetchJson(path);
  }

  async getAddressInfo(address: string) {
    return this.fetchJson(`/addresses/${address}`);
  }

  async getChainStats() {
    return this.fetchJson('/stats');
  }
}
