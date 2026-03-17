import { StargateClient, QueryClient, StakingExtension, DistributionExtension } from '@cosmjs/stargate';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Comet38Client } from '@cosmjs/tendermint-rpc';
import { NetworkConfig } from '../config.js';

export class BaseService {
  protected stargateClient: StargateClient;
  protected wasmClient: CosmWasmClient;
  protected queryClient: QueryClient & StakingExtension & DistributionExtension;
  protected cometClient: Comet38Client;
  protected network: NetworkConfig;

  constructor(
    stargateClient: StargateClient,
    wasmClient: CosmWasmClient,
    queryClient: QueryClient & StakingExtension & DistributionExtension,
    cometClient: Comet38Client,
    network: NetworkConfig
  ) {
    this.stargateClient = stargateClient;
    this.wasmClient = wasmClient;
    this.queryClient = queryClient;
    this.cometClient = cometClient;
    this.network = network;
  }
}
