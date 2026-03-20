import type { GetLogsParameters, Log, ReadContractParameters } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient, getArchiveClient } from './clients.js';
import { isPruningError } from '../evm-archive-fallback.js';
import * as services from './index.js';

/**
 * Read from a contract for a specific network.
 * Automatically falls back to archive node for historical queries.
 */
export async function readContract(params: ReadContractParameters, network = DEFAULT_NETWORK) {
	const client = getPublicClient(network);
	try {
		return await client.readContract(params);
	} catch (error) {
		if (isPruningError(error) && params.blockNumber !== undefined) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.readContract(params);
			}
		}
		throw error;
	}
}

/**
 * Get logs for a specific network.
 * Automatically falls back to archive node for historical queries.
 */
export async function getLogs(params: GetLogsParameters, network = DEFAULT_NETWORK): Promise<Log[]> {
	const client = getPublicClient(network);
	try {
		return await client.getLogs(params);
	} catch (error) {
		if (isPruningError(error)) {
			const archiveClient = getArchiveClient(network);
			if (archiveClient) {
				return await archiveClient.getLogs(params);
			}
		}
		throw error;
	}
}

/**
 * Check if an address is a contract
 */
export async function isContract(address: string, network = DEFAULT_NETWORK): Promise<boolean> {
	const validatedAddress = services.helpers.validateAddress(address);

	const client = getPublicClient(network);
	const code = await client.getCode({ address: validatedAddress });
	return code !== undefined && code !== '0x';
}
