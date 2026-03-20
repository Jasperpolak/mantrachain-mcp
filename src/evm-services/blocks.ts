import type { Block, Hash } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient, getArchiveClient } from './clients.js';
import { isPruningError } from '../evm-archive-fallback.js';

/**
 * Get a block by number for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getBlockByNumber(blockNumber?: number, network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	const params = blockNumber !== undefined ? { blockNumber: BigInt(blockNumber) } : {};
	try {
		return await client.getBlock(params);
	} catch (error) {
		if (blockNumber !== undefined && isPruningError(error)) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.getBlock(params);
			}
		}
		throw error;
	}
}

/**
 * Get a block by hash for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getBlockByHash(blockHash: Hash, network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	try {
		return await client.getBlock({ blockHash });
	} catch (error) {
		if (isPruningError(error)) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.getBlock({ blockHash });
			}
		}
		throw error;
	}
}

/**
 * Get the latest block for a specific network
 */
export async function getLatestBlock(network = DEFAULT_NETWORK): Promise<Block> {
	const client = getPublicClient(network);
	return await client.getBlock();
}
