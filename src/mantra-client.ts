import { StargateClient, QueryClient, setupStakingExtension, StakingExtension, setupDistributionExtension, DistributionExtension } from '@cosmjs/stargate';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { networks, NetworkConfig, DEFAULT_NETWORK } from './config.js';
import { Comet38Client } from '@cosmjs/tendermint-rpc';
import { BankService } from './services/bank-service.js';
import { StakingService } from './services/staking-service.js';
import { NetworkService } from './services/network-service.js';
import { ContractService, ContractQueryParams } from './services/contract-service.js';
import { DexService, SwapParams, PoolInfo, SwapOperation } from './services/dex-service.js';
import { BlockscoutService } from './services/blockscout-service.js';

interface NetworkClients {
  bankService: BankService;
  stakingService: StakingService;
  networkService: NetworkService;
  contractService: ContractService;
  dexService: DexService;
  blockscoutService?: BlockscoutService;
}

export class MantraClient {
  private cache = new Map<string, NetworkClients>();
  private activeNetwork: string = DEFAULT_NETWORK;

  async initialize(networkName: string) {
    if (!Object.keys(networks).includes(networkName)) {
      networkName = DEFAULT_NETWORK;
    }

    this.activeNetwork = networkName;

    // Return early if already connected to this network
    if (this.cache.has(networkName)) return;

    const network = networks[networkName];
    const wasmClient = await CosmWasmClient.connect(network.rpcEndpoint);
    const stargateClient = await StargateClient.connect(network.rpcEndpoint);
    const cometClient = await Comet38Client.connect(network.rpcEndpoint);
    const queryClient = QueryClient.withExtensions(
      cometClient,
      setupStakingExtension,
      setupDistributionExtension,
    );

    const args: [StargateClient, CosmWasmClient, QueryClient & StakingExtension & DistributionExtension, Comet38Client, NetworkConfig] =
      [stargateClient, wasmClient, queryClient, cometClient, network];

    this.cache.set(networkName, {
      bankService: new BankService(...args),
      stakingService: new StakingService(...args),
      networkService: new NetworkService(...args),
      contractService: new ContractService(...args),
      dexService: new DexService(...args),
      blockscoutService: network.blockscoutEndpoint ? new BlockscoutService(network) : undefined,
    });
  }

  private get services(): NetworkClients {
    const clients = this.cache.get(this.activeNetwork);
    if (!clients) throw new Error('Client not initialized. Call initialize() first.');
    return clients;
  }

  async getBalance(address: string) {
    return this.services.bankService.getBalance(address);
  }

  async getValidators() {
    return this.services.stakingService.getValidators();
  }

  async getDelegations(address: string) {
    return this.services.stakingService.getDelegations(address);
  }

  async getUnbondingDelegations(address: string) {
    return this.services.stakingService.getUnbondingDelegations(address);
  }

  async getAvailableRewards(address: string) {
    return this.services.stakingService.getAvailableRewards(address);
  }

  async getBlockInfo(height?: number) {
    return this.services.networkService.getBlockInfo(height);
  }

  async queryContract(params: ContractQueryParams): Promise<any> {
    return this.services.contractService.queryContract(params);
  }

  async getPools(): Promise<PoolInfo[]> {
    return this.services.dexService.getPools();
  }

  async findSwapRoutes(tokenInDenom: string, tokenOutDenom: string): Promise<SwapOperation[][]> {
    return this.services.dexService.findRoutes(tokenInDenom, tokenOutDenom);
  }

  async simulateSwap(params: SwapParams): Promise<{ expectedReturn: string, routes: SwapOperation[] }> {
    return this.services.dexService.simulateSwap(params);
  }

  private get blockscout(): BlockscoutService {
    const svc = this.services.blockscoutService;
    if (!svc) throw new Error('Blockscout is not available for this network');
    return svc;
  }

  async getAddressTransactions(address: string, pageParams?: Record<string, string>) {
    return this.blockscout.getAddressTransactions(address, pageParams);
  }

  async getAddressTokens(address: string, options?: { type?: string }, pageParams?: Record<string, string>) {
    return this.blockscout.getAddressTokens(address, options, pageParams);
  }

  async getAddressInternalTransactions(address: string, pageParams?: Record<string, string>) {
    return this.blockscout.getAddressInternalTransactions(address, pageParams);
  }

  async getNFTInstance(contractAddress: string, tokenId: string) {
    return this.blockscout.getNFTInstance(contractAddress, tokenId);
  }

  async getTokenInfo(contractAddress: string) {
    return this.blockscout.getTokenInfo(contractAddress);
  }

  async getAddressTokenTransfers(address: string, options?: { token?: string; type?: string }, pageParams?: Record<string, string>) {
    return this.blockscout.getAddressTokenTransfers(address, options, pageParams);
  }

  async getTokenHolders(contractAddress: string, pageParams?: Record<string, string>) {
    return this.blockscout.getTokenHolders(contractAddress, pageParams);
  }

  async getAddressInfo(address: string) {
    return this.blockscout.getAddressInfo(address);
  }

  async getChainStats() {
    return this.blockscout.getChainStats();
  }
}
