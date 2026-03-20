import { http, type PublicClient, createPublicClient } from 'viem';
import { DEFAULT_NETWORK, getChain, networks } from '../config.js';

// Cache for clients to avoid recreating them for each request
const clientCache = new Map<string, PublicClient>();
const archiveClientCache = new Map<string, PublicClient>();

/**
 * Get a public client for a specific network
 */
export function getPublicClient(network = DEFAULT_NETWORK): PublicClient {
	const cacheKey = String(network);

	const cached = clientCache.get(cacheKey);
	if (cached) return cached;

	const chain = getChain(network);
	const rpcUrl = chain.rpcUrls.default.http[0];

	const client = createPublicClient({
		chain,
		transport: http(rpcUrl)
	});

	clientCache.set(cacheKey, client);

	return client;
}

/**
 * Get an archive public client for a specific network (for historical queries).
 * Returns null if no archive endpoint is configured.
 */
export function getArchiveClient(network = DEFAULT_NETWORK): PublicClient | null {
	const config = networks[network];
	if (!config?.evmArchiveEndpoint) return null;

	const cacheKey = String(network);
	const cached = archiveClientCache.get(cacheKey);
	if (cached) return cached;

	const chain = getChain(network);

	const client = createPublicClient({
		chain,
		transport: http(config.evmArchiveEndpoint)
	});

	archiveClientCache.set(cacheKey, client);

	return client;
}
