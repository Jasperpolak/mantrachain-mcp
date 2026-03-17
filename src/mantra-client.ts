import { StargateClient, QueryClient, setupStakingExtension, StakingExtension, setupDistributionExtension, DistributionExtension } from '@cosmjs/stargate';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { networks, NetworkConfig, DEFAULT_NETWORK } from './config.js';
import { Comet38Client } from '@cosmjs/tendermint-rpc';
import { BankService } from './services/bank-service.js';
import { StakingService } from './services/staking-service.js';
import { NetworkService } from './services/network-service.js';
import { ContractService, ContractQueryParams } from './services/contract-service.js';
import { DexService, SwapParams, PoolInfo, SwapOperation } from './services/dex-service.js';

export class MantraClient {
  private wasmClient: CosmWasmClient | null = null;
  private stargateClient: StargateClient | null = null;
  private queryClient: (QueryClient & StakingExtension & DistributionExtension) | null = null;
  private cometClient: Comet38Client | null = null;
  private network: NetworkConfig | null = null;

  // Service instances
  private bankService: BankService | null = null;
  private stakingService: StakingService | null = null;
  private networkService: NetworkService | null = null;
  private contractService: ContractService | null = null;
  private dexService: DexService | null = null;

  async initialize(networkName: string) {
    if (!Object.keys(networks).includes(networkName)) {
      networkName = DEFAULT_NETWORK;
    }
    this.network = networks[networkName];
    this.wasmClient = await CosmWasmClient.connect(this.network.rpcEndpoint);
    this.stargateClient = await StargateClient.connect(this.network.rpcEndpoint);
    this.cometClient = await Comet38Client.connect(this.network.rpcEndpoint);
    this.queryClient = QueryClient.withExtensions(
      this.cometClient,
      setupStakingExtension,
      setupDistributionExtension,
    );

    // Initialize services
    if (this.stargateClient && this.wasmClient && this.queryClient && this.network) {
      this.bankService = new BankService(
        this.stargateClient,
        this.wasmClient,
        this.queryClient,
        this.cometClient,
        this.network
      );
      this.stakingService = new StakingService(
        this.stargateClient,
        this.wasmClient,
        this.queryClient,
        this.cometClient,
        this.network
      );
      this.networkService = new NetworkService(
        this.stargateClient,
        this.wasmClient,
        this.queryClient,
        this.cometClient,
        this.network
      );
      this.contractService = new ContractService(
        this.stargateClient,
        this.wasmClient,
        this.queryClient,
        this.cometClient,
        this.network
      );
      this.dexService = new DexService(
        this.stargateClient,
        this.wasmClient,
        this.queryClient,
        this.cometClient,
        this.network
      );
    }

    return {
      chainId: await this.wasmClient.getChainId(),
    };
  }

  /**
   * Query account balance
   */
  async getBalance(address: string) {
    if (!this.bankService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.bankService.getBalance(address);
  }

  /**
   * Get all validators on the network
   */
  async getValidators() {
    if (!this.stakingService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.stakingService.getValidators();
  }

  /**
   * Get the current staking information for an address
   */
  async getDelegations(address: string) {
    if (!this.stakingService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.stakingService.getDelegations(address);
  }

  /**
   * Get all available rewards for an address
   */
  async getAvailableRewards(address: string) {
    if (!this.stakingService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.stakingService.getAvailableRewards(address);
  }

  /**
   * Get the current block height
   */
  async getBlockInfo(height?: number) {
    if (!this.networkService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.networkService.getBlockInfo(height);
  }

  /**
   * Query a smart contract by executing a read-only function
   */
  async queryContract(params: ContractQueryParams): Promise<any> {
    if (!this.contractService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.contractService.queryContract(params);
  }

  /**
   * Get all DEX pools
   */
  async getPools(): Promise<PoolInfo[]> {
    if (!this.dexService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.dexService.getPools();
  }

  /**
   * Find swap routes between two tokens
   */
  async findSwapRoutes(tokenInDenom: string, tokenOutDenom: string): Promise<SwapOperation[][]> {
    if (!this.dexService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.dexService.findRoutes(tokenInDenom, tokenOutDenom);
  }

  /**
   * Simulate a token swap
   */
  async simulateSwap(params: SwapParams): Promise<{ expectedReturn: string, routes: SwapOperation[] }> {
    if (!this.dexService) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    return this.dexService.simulateSwap(params);
  }
}
