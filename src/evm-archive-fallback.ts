import { fromBech32, toBech32, toHex, fromHex } from '@cosmjs/encoding';
import { getAddress } from 'viem';
import { networks } from './config.js';

/**
 * Block at which EVM was activated on MANTRA mainnet (Proposal #20, v5.0 Abunnati, Sep 17 2025).
 * Before this block, only Cosmos data exists.
 */
export const EVM_ACTIVATION_BLOCK = 8_618_888;

/**
 * Check if an error is a pruning/archive error (node doesn't have the block).
 */
export function isPruningError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('header not found') ||
    msg.includes('is not available, lowest height is') ||
    msg.includes('missing trie node') ||
    msg.includes('block not found')
  );
}

/**
 * Check if a block number is before EVM activation.
 */
export function isPreEvmBlock(blockNumber: number | bigint): boolean {
  return Number(blockNumber) < EVM_ACTIVATION_BLOCK;
}

/**
 * Convert an EVM address (0x...) to bech32 (mantra1...).
 */
export function evmToBech32(evmAddress: string): string {
  const hexStr = evmAddress.slice(2).toLowerCase();
  const data = fromHex(hexStr);
  return toBech32('mantra', data);
}

/**
 * Convert a bech32 address (mantra1...) to EVM (0x...).
 */
export function bech32ToEvm(bech32Address: string): string {
  const { data } = fromBech32(bech32Address);
  return getAddress('0x' + toHex(data));
}

/**
 * Get the archive API endpoint for Cosmos queries on a network.
 */
export function getArchiveApiEndpoint(networkName: string): string {
  const network = networks[networkName];
  return (network.archiveApiEndpoint || network.apiEndpoint).replace(/\/+$/, '');
}
