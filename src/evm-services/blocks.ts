import type { Block, Hash } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient, withArchiveFallback } from './clients.js';

/**
 * Get a block by number for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getBlockByNumber(blockNumber?: number, network = DEFAULT_NETWORK): Promise<Block> {
	if (blockNumber === undefined) {
		return await getPublicClient(network).getBlock();
	}
	return withArchiveFallback(network, client =>
		client.getBlock({ blockNumber: BigInt(blockNumber) })
	);
}

/**
 * Get a block by hash for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getBlockByHash(blockHash: Hash, network = DEFAULT_NETWORK): Promise<Block> {
	return withArchiveFallback(network, client =>
		client.getBlock({ blockHash })
	);
}

/**
 * Get the latest block for a specific network
 */
export async function getLatestBlock(network = DEFAULT_NETWORK): Promise<Block> {
	return await getPublicClient(network).getBlock();
}
