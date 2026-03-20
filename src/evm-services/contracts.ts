import type { GetLogsParameters, Log, ReadContractParameters } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient, withArchiveFallback } from './clients.js';
import { utils as helpers } from './utils.js';

/**
 * Read from a contract for a specific network.
 * Automatically falls back to archive node for historical queries.
 */
export async function readContract(params: ReadContractParameters, network = DEFAULT_NETWORK) {
	if (params.blockNumber === undefined) {
		return await getPublicClient(network).readContract(params);
	}
	return withArchiveFallback(network, client => client.readContract(params));
}

/**
 * Get logs for a specific network.
 * Automatically falls back to archive node for historical queries.
 */
export async function getLogs(params: GetLogsParameters, network = DEFAULT_NETWORK): Promise<Log[]> {
	return withArchiveFallback(network, client => client.getLogs(params));
}

/**
 * Check if an address is a contract
 */
export async function isContract(address: string, network = DEFAULT_NETWORK): Promise<boolean> {
	const validatedAddress = helpers.validateAddress(address);
	const client = getPublicClient(network);
	const code = await client.getCode({ address: validatedAddress });
	return code !== undefined && code !== '0x';
}
