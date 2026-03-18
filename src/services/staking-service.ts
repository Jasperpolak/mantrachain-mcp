import { BaseService } from './base-service.js';

export class StakingService extends BaseService {
  /**
   * Get all validators on the network
   */
  async getValidators() {
    try {
      const response = await this.queryClient.staking.validators('BOND_STATUS_BONDED');
      const validators = response.validators.sort((a, b) => {
        return Number(BigInt(b.tokens) - BigInt(a.tokens));
      });
      return validators;
    } catch (error) {
      throw new Error(`Failed to fetch validators: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all delegations for a specific address
   */
  async getDelegations(address: string) {
    try {
      const response = await this.queryClient.staking.delegatorDelegations(address);
      return response.delegationResponses;
    } catch (error) {
      throw new Error(`Failed to fetch delegations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all unbonding delegations for a specific address
   */
  async getUnbondingDelegations(address: string) {
    try {
      const response = await this.queryClient.staking.delegatorUnbondingDelegations(address);
      return response.unbondingResponses;
    } catch (error) {
      throw new Error(`Failed to fetch unbonding delegations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available rewards for a specific address
   */
  async getAvailableRewards(address: string) {
    try {
      const response = await this.queryClient.distribution.delegationTotalRewards(address);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch available rewards: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
