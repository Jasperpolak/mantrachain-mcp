import { JsonObject } from '@cosmjs/cosmwasm-stargate';
import { BaseService } from './base-service.js';

export interface ContractQueryParams {
  contractAddress: string;
  queryMsg: JsonObject;
}

export class ContractService extends BaseService {
  /**
   * Query a smart contract by executing a read-only function
   */
  async queryContract(params: ContractQueryParams): Promise<any> {
    const { contractAddress, queryMsg } = params;

    try {
      const result = await this.wasmClient.queryContractSmart(contractAddress, queryMsg);
      return result;
    } catch (error) {
      console.error('Error querying contract:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
