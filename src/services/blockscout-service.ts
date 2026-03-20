import { NetworkConfig } from '../config.js';

const FETCH_TIMEOUT_MS = 15_000;

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
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Blockscout API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  private buildQuery(params: Record<string, string | undefined>, pageParams?: Record<string, string>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, v);
    }
    if (pageParams) {
      for (const [k, v] of Object.entries(pageParams)) {
        qs.set(k, v);
      }
    }
    const str = qs.toString();
    return str ? `?${str}` : '';
  }

  async getAddressTransactions(address: string, pageParams?: Record<string, string>) {
    return this.fetchJson(`/addresses/${address}/transactions${this.buildQuery({}, pageParams)}`);
  }

  async getAddressTokens(address: string, options?: { type?: string }, pageParams?: Record<string, string>) {
    return this.fetchJson(`/addresses/${address}/tokens${this.buildQuery({ type: options?.type }, pageParams)}`);
  }

  async getAddressInternalTransactions(address: string, pageParams?: Record<string, string>) {
    return this.fetchJson(`/addresses/${address}/internal-transactions${this.buildQuery({}, pageParams)}`);
  }

  async getNFTInstance(contractAddress: string, tokenId: string) {
    return this.fetchJson(`/tokens/${contractAddress}/instances/${tokenId}`);
  }

  async getTokenInfo(contractAddress: string) {
    return this.fetchJson(`/tokens/${contractAddress}`);
  }

  async getAddressTokenTransfers(address: string, options?: { token?: string; type?: string }, pageParams?: Record<string, string>) {
    return this.fetchJson(`/addresses/${address}/token-transfers${this.buildQuery({ token: options?.token, type: options?.type }, pageParams)}`);
  }

  async getTokenHolders(contractAddress: string, pageParams?: Record<string, string>) {
    return this.fetchJson(`/tokens/${contractAddress}/holders${this.buildQuery({}, pageParams)}`);
  }

  async getAddressInfo(address: string) {
    return this.fetchJson(`/addresses/${address}`);
  }

  async getChainStats() {
    return this.fetchJson('/stats');
  }
}
