import { networks } from './config.js';

/** Block at which EVM was activated on MANTRA mainnet (Proposal #20, v5.0 Abunnati, Sep 17 2025). */
export const EVM_ACTIVATION_BLOCK = 8_618_888;

/** Max block range for eth_getLogs queries (RPC limit). */
export const MAX_LOG_RANGE = 10_000;

const FETCH_TIMEOUT_MS = 15_000;

/** Check if an error is a pruning/archive error (node doesn't have the block). */
export function isPruningError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('could not be found') ||
    msg.includes('header not found') ||
    msg.includes('is not available, lowest height is') ||
    msg.includes('missing trie node') ||
    msg.includes('block not found')
  );
}

/** Check if a block number is before EVM activation. */
export function isPreEvmBlock(blockNumber: number | bigint): boolean {
  return Number(blockNumber) < EVM_ACTIVATION_BLOCK;
}

/** Get the archive API endpoint for Cosmos queries on a network. */
export function getArchiveApiEndpoint(networkName: string): string {
  const network = networks[networkName];
  return (network.archiveApiEndpoint || network.apiEndpoint).replace(/\/+$/, '');
}

/**
 * Fetch a block from the archive Cosmos REST API.
 * Bypasses the pruned standard RPC.
 */
export async function fetchArchiveCosmosBlock(networkName: string, height: number): Promise<any> {
  const baseUrl = getArchiveApiEndpoint(networkName);
  const response = await fetch(`${baseUrl}/cosmos/base/tendermint/v1beta1/blocks/${height}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Archive API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
