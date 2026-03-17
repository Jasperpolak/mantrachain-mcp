import { formatEther, formatUnits, getContract } from 'viem';
import { getPublicClient } from './clients.js';
import { readContract } from './contracts.js';
import * as services from './index.js';
import { DEFAULT_NETWORK } from '../config.js';
import { erc20Abi, erc721Abi, erc1155Abi } from './abis.js';

/**
 * Get the native MANTRA balance for an address
 */
export async function getBalance(address: string, network = DEFAULT_NETWORK): Promise<{ wei: bigint; mantra: string }> {
	const validatedAddress = services.helpers.validateAddress(address);
	const client = getPublicClient(network);
	const balance = await client.getBalance({ address: validatedAddress });

	return {
		wei: balance,
		mantra: formatEther(balance)
	};
}

/**
 * Get the balance of an ERC20 token for an address
 */
export async function getERC20Balance(
	tokenAddress: string,
	ownerAddress: string,
	network = DEFAULT_NETWORK
): Promise<{
	raw: bigint;
	formatted: string;
	token: {
		symbol: string;
		decimals: number;
	};
}> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	const publicClient = getPublicClient(network);

	const contract = getContract({
		address: validatedTokenAddress,
		abi: erc20Abi,
		client: publicClient
	});

	const [balance, symbol, decimals] = await Promise.all([contract.read.balanceOf([validatedOwnerAddress]), contract.read.symbol(), contract.read.decimals()]);

	return {
		raw: balance,
		formatted: formatUnits(balance, decimals),
		token: {
			symbol,
			decimals
		}
	};
}

/**
 * Get the number of NFTs owned by an address for a specific collection
 */
export async function getERC721Balance(tokenAddress: string, ownerAddress: string, network = DEFAULT_NETWORK): Promise<bigint> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	return (await readContract(
		{
			address: validatedTokenAddress,
			abi: erc721Abi,
			functionName: 'balanceOf',
			args: [validatedOwnerAddress]
		},
		network
	)) as Promise<bigint>;
}

/**
 * Get the balance of an ERC1155 token for an address
 */
export async function getERC1155Balance(tokenAddress: string, ownerAddress: string, tokenId: bigint, network = DEFAULT_NETWORK): Promise<bigint> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	return (await readContract(
		{
			address: validatedTokenAddress,
			abi: erc1155Abi,
			functionName: 'balanceOf',
			args: [validatedOwnerAddress, tokenId]
		},
		network
	)) as Promise<bigint>;
}
