import { http, type PublicClient, createPublicClient } from 'viem';
import { DEFAULT_NETWORK, getChain } from '../config.js';

// Cache for clients to avoid recreating them for each request
const clientCache = new Map<string, PublicClient>();

/**
 * Get a public client for a specific network
 */
export function getPublicClient(network = DEFAULT_NETWORK): PublicClient {
	const cacheKey = String(network);

	if (clientCache.has(cacheKey)) {
		const cachedClient = clientCache.get(cacheKey);
		if (!cachedClient) {
			throw new Error(`Client cache inconsistency for network ${network}`);
		}
		return cachedClient;
	}

	const chain = getChain(network);
	const rpcUrl = chain.rpcUrls.default.http[0];

	const client = createPublicClient({
		chain,
		transport: http(rpcUrl)
	});

	clientCache.set(cacheKey, client);

	return client;
}
