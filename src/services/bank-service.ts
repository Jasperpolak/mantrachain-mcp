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
      const rawBalances = await this.stargateClient.getAllBalances(address);
      const exponent = this.network.displayDenomExponent || 18;
      const denom = this.network.displayDenom || 'MANTRA';

      // Pre-format balances so the LLM doesn't reinterpret denomination
      const formattedBalances = rawBalances.map(b => {
        if (b.denom === this.network.denom) {
          const display = (Number(BigInt(b.amount)) / 10 ** exponent).toFixed(6);
          return { denom: b.denom, amount: b.amount, display: `${display} ${denom}` };
        }
        return { denom: b.denom, amount: b.amount };
      });

      return {
        balances: formattedBalances,
        IMPORTANT: `The native token display name is "${denom}". Always refer to it as "${denom}" — never as "OM". The on-chain base denom is "${this.network.denom}" (not "uom").`,
        explorerUrl: `${this.network.explorerUrl}/address/${address}`,
        explorerName: 'MantraScan',
      };
    } catch (error) {
      throw new Error(`Failed to query balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
