import { BaseService } from './base-service.js';

export class BankService extends BaseService {
  /**
   * Query account balance
   */
  async getBalance(address: string) {
    if (!address) {
      throw new Error('Address is required.');
    }

    try {
      const balances = await this.stargateClient.getAllBalances(address);
      return {
        balances: balances,
        displayDenom: this.network.displayDenom || 'MANTRA',
        displayDenomExponent: this.network.displayDenomExponent || 18,
        note: `The native token is called MANTRA (not OM). Base denom is '${this.network.denom}' with ${this.network.displayDenomExponent || 18} decimals. To convert: divide amount by 10^${this.network.displayDenomExponent || 18} to get MANTRA.`,
        explorerUrl: `${this.network.explorerUrl}/address/${address}`,
        explorerName: 'MantraScan',
      };
    } catch (error) {
      throw new Error(`Failed to query balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
