import type { Address, EstimateGasParameters, Hash, TransactionReceipt } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient, getArchiveClient } from './clients.js';
import { isPruningError } from '../evm-archive-fallback.js';

/**
 * Get a transaction by hash for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getTransaction(hash: Hash, network = DEFAULT_NETWORK) {
	const client = getPublicClient(network);
	try {
		return await client.getTransaction({ hash });
	} catch (error) {
		if (isPruningError(error)) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.getTransaction({ hash });
			}
		}
		throw error;
	}
}

/**
 * Get a transaction receipt by hash for a specific network.
 * Automatically falls back to archive node if pruned.
 */
export async function getTransactionReceipt(hash: Hash, network = DEFAULT_NETWORK): Promise<TransactionReceipt> {
	const client = getPublicClient(network);
	try {
		return await client.getTransactionReceipt({ hash });
	} catch (error) {
		if (isPruningError(error)) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.getTransactionReceipt({ hash });
			}
		}
		throw error;
	}
}

/**
 * Get the transaction count for an address for a specific network
 */
export async function getTransactionCount(address: Address, network = DEFAULT_NETWORK): Promise<number> {
	const client = getPublicClient(network);
	const count = await client.getTransactionCount({ address });
	return Number(count);
}

/**
 * Estimate gas for a transaction for a specific network
 */
export async function estimateGas(params: EstimateGasParameters, network = DEFAULT_NETWORK): Promise<bigint> {
	const client = getPublicClient(network);
	return await client.estimateGas(params);
}

/**
 * Get the chain ID for a specific network
 */
export async function getChainId(network = DEFAULT_NETWORK): Promise<number> {
	const client = getPublicClient(network);
	const chainId = await client.getChainId();
	return Number(chainId);
}
