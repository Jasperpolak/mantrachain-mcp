import type { GetLogsParameters, Log, ReadContractParameters } from 'viem';
import { DEFAULT_NETWORK } from '../config.js';
import { getPublicClient } from './clients.js';
import * as services from './index.js';

/**
 * Read from a contract for a specific network
 */
export async function readContract(params: ReadContractParameters, network = DEFAULT_NETWORK) {
	const client = getPublicClient(network);
	return await client.readContract(params);
}

/**
 * Get logs for a specific network
 */
export async function getLogs(params: GetLogsParameters, network = DEFAULT_NETWORK): Promise<Log[]> {
	const client = getPublicClient(network);
	return await client.getLogs(params);
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
