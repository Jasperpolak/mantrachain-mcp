import dotenv from 'dotenv';
import type { Chain } from 'viem';

// Load environment variables
dotenv.config();

export interface NetworkConfig {
  rpcEndpoint: string;
  apiEndpoint: string;
  archiveApiEndpoint?: string;
  evmEndpoint?: string;
  evmArchiveEndpoint?: string;
  evmChainId?: string;
  chainId: string;
  prefix: string;
  denom: string;
  gasPrice: string;
  isMainnet: boolean;
  defaultNetwork?: boolean;
  displayDenom?: string;
  displayDenomExponent?: number;
  explorerUrl?: string;
  dexContractAddress?: string;
  blockscoutEndpoint?: string;
  algebraPositionManager?: string;
}

// Network configurations
const NETWORKS: Record<string, NetworkConfig> = {
  "mantra-1": {
    rpcEndpoint: 'https://rpc.mantrachain.io',
    apiEndpoint: 'https://api.mantrachain.io',
    archiveApiEndpoint: 'https://api.archive.mantrachain.io',
    evmEndpoint: 'https://evm.mantrachain.io',
    evmArchiveEndpoint: 'https://evm.archive.mantrachain.io',
    evmChainId: '5888',
    chainId: 'mantra-1',
    prefix: 'mantra',
    denom: 'amantra',
    gasPrice: '40000000000',
    isMainnet: true,
    defaultNetwork: true,
    displayDenom: 'MANTRA',
    displayDenomExponent: 18,
    explorerUrl: 'https://mantrascan.io/mainnet',
    dexContractAddress: 'mantra1466nf3zuxpya8q9emxukd7vftaf6h4psr0a07srl5zw74zh84yjqagspfm',
    blockscoutEndpoint: 'https://blockscout.mantrascan.io/api/v2',
    algebraPositionManager: '0x69D57B9D990ee65f1BCbe3Be8DBf90431025dF3d'
  },
  "mantra-dukong-1": {
    rpcEndpoint: 'https://rpc.dukong.mantrachain.io',
    apiEndpoint: 'https://api.dukong.mantrachain.io',
    evmEndpoint: 'https://evm.dukong.mantrachain.io',
    chainId: 'mantra-dukong-1',
    evmChainId: '5887',
    prefix: 'mantra',
    denom: 'amantra',
    gasPrice: '40000000000',
    isMainnet: false,
    defaultNetwork: false,
    displayDenom: 'MANTRA',
    displayDenomExponent: 18,
    explorerUrl: 'https://www.mintscan.io/mantra-testnet',
    dexContractAddress: 'mantra1us7rryvauhpe82fff0t6gjthdraqmtm5gw8c808f6eqzuxmulacqzkzdal'
  },
};

export const DEFAULT_NETWORK = 'mantra-1';

// Add custom networks from environment variable if available
if (process.env.CUSTOM_NETWORKS) {
  try {
    const customNetworks = JSON.parse(process.env.CUSTOM_NETWORKS);
    Object.assign(NETWORKS, customNetworks);
    console.log('Custom networks loaded:', Object.keys(customNetworks));
  } catch (error) {
    console.error('Failed to parse CUSTOM_NETWORKS:', error);
  }
}

export const networks = NETWORKS;

export function getChain(networkName: string = DEFAULT_NETWORK): Chain {
  const network = networks[networkName];
  if (!network) {
    throw new Error(`Network ${networkName} not found`);
  }
  if (!network.evmEndpoint) {
    throw new Error(`Network ${networkName} does not support EVM`);
  }
  return {
    id: Number(network.evmChainId),
    name: networkName,
    rpcUrls: {
      default: { http: [network.evmEndpoint] }
    },
    nativeCurrency: {
      name: network.displayDenom || 'MANTRA',
      symbol: network.displayDenom || 'MANTRA',
      decimals: 18,
    },
  };
}
