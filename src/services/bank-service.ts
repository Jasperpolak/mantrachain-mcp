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
        explorerUrl: `${this.network.explorerUrl}/address/${address}`,
      };
    } catch (error) {
      throw new Error(`Failed to query balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
