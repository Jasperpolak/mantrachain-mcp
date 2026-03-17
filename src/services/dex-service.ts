import { BaseService } from './base-service.js';

export interface SwapParams {
  tokenIn: { denom: string; amount: string };
  tokenOutDenom: string;
  slippage?: string;
  memo?: string;
}

export interface MantraSwap {
  pool_identifier: string;
  token_in_denom: string;
  token_out_denom: string;
}

export interface SwapOperation {
  mantra_swap: MantraSwap;
}

export interface PoolInfo {
  pool_info: {
    pool_identifier: string;
    asset_denoms: string[];
    lp_denom: string;
    asset_decimals: number[];
    assets: {
      denom: string;
      amount: string;
    }[];
    pool_type: string | { stable_swap: { amp: number } };
    pool_fees: {
      protocol_fee: { share: string };
      swap_fee: { share: string };
      burn_fee: { share: string };
      extra_fees: any[];
    };
  };
  total_share: {
    denom: string;
    amount: string;
  };
}

export class DexService extends BaseService {
  private getDexContractAddress(): string {
    if (!this.network.dexContractAddress) {
      throw new Error('DEX contract address not found for the current network');
    }
    return this.network.dexContractAddress;
  }

  /**
   * Get all pools from the DEX
   */
  async getPools(): Promise<PoolInfo[]> {
    try {
      const contractAddress = this.getDexContractAddress();
      const response = await this.wasmClient.queryContractSmart(contractAddress, {
        pools: {}
      });
      return response.pools;
    } catch (error) {
      throw new Error(`Failed to get pools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find swap routes between two tokens
   */
  async findRoutes(tokenInDenom: string, tokenOutDenom: string): Promise<SwapOperation[][]> {
    try {
      const pools = await this.getPools();

      const directPools = pools.filter(pool => {
        const denoms = pool.pool_info.asset_denoms;
        return denoms.includes(tokenInDenom) && denoms.includes(tokenOutDenom);
      });

      const directRoutes = directPools.map(pool => [{
        mantra_swap: {
          pool_identifier: pool.pool_info.pool_identifier,
          token_in_denom: tokenInDenom,
          token_out_denom: tokenOutDenom
        }
      }]);

      if (directRoutes.length > 0) {
        return directRoutes;
      }

      const multiHopRoutes: SwapOperation[][] = [];

      const poolsWithTokenIn = pools.filter(pool =>
        pool.pool_info.asset_denoms.some(denom => denom === tokenInDenom)
      );

      const poolsWithTokenOut = pools.filter(pool =>
        pool.pool_info.asset_denoms.some(denom => denom === tokenOutDenom)
      );

      for (const inPool of poolsWithTokenIn) {
        const inPoolDenoms = inPool.pool_info.asset_denoms;

        for (const intermediateToken of inPoolDenoms) {
          if (intermediateToken === tokenInDenom) continue;

          const connectedOutPools = poolsWithTokenOut.filter(outPool =>
            outPool.pool_info.asset_denoms.some(denom => denom === intermediateToken)
          );

          for (const outPool of connectedOutPools) {
            multiHopRoutes.push([
              {
                mantra_swap: {
                  pool_identifier: inPool.pool_info.pool_identifier,
                  token_in_denom: tokenInDenom,
                  token_out_denom: intermediateToken
                }
              },
              {
                mantra_swap: {
                  pool_identifier: outPool.pool_info.pool_identifier,
                  token_in_denom: intermediateToken,
                  token_out_denom: tokenOutDenom
                }
              }
            ]);
          }
        }
      }

      return [...directRoutes, ...multiHopRoutes];
    } catch (error) {
      throw new Error(`Failed to find swap routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Simulate a swap to get the expected return amount
   */
  async simulateSwap(params: SwapParams): Promise<{
    expectedReturn: string;
    routes: SwapOperation[];
  }> {
    try {
      const routes = await this.findRoutes(params.tokenIn.denom, params.tokenOutDenom);

      if (routes.length === 0) {
        throw new Error(`No route found for swap from ${params.tokenIn.denom} to ${params.tokenOutDenom}`);
      }

      let bestRoute = routes[0];
      let bestReturnAmount = '0';

      for (const route of routes) {
        const contractAddress = this.getDexContractAddress();
        const response = await this.wasmClient.queryContractSmart(contractAddress, {
          simulate_swap_operations: {
            operations: route,
            offer_amount: params.tokenIn.amount
          }
        });

        if (BigInt(response.return_amount) > BigInt(bestReturnAmount)) {
          bestReturnAmount = response.return_amount;
          bestRoute = route;
        }
      }

      return {
        expectedReturn: bestReturnAmount,
        routes: bestRoute
      };
    } catch (error) {
      throw new Error(`Failed to simulate swap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
