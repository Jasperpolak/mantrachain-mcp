import { type Address, formatUnits, getContract } from 'viem';
import { getPublicClient } from './clients.js';
import * as services from './index.js';
import { readContract } from './contracts.js';
import { DEFAULT_NETWORK } from '../config.js';
import { erc20Abi, erc721Abi, erc1155Abi } from './abis.js';

/**
 * Get ERC20 token information
 */
export async function getERC20TokenInfo(
	tokenAddress: Address,
	network = DEFAULT_NETWORK
): Promise<{
	name: string;
	symbol: string;
	decimals: number;
	totalSupply: string;
	formattedTotalSupply: string;
}> {
	const publicClient = getPublicClient(network);

	const contract = getContract({
		address: tokenAddress,
		abi: erc20Abi,
		client: publicClient
	});

	const [name, symbol, decimals, totalSupply] = await Promise.all([
		contract.read.name(),
		contract.read.symbol(),
		contract.read.decimals(),
		contract.read.totalSupply()
	]);

	return {
		name,
		symbol,
		decimals,
		totalSupply: totalSupply.toString(),
		formattedTotalSupply: formatUnits(totalSupply, decimals)
	};
}

/**
 * Get ERC721 token metadata
 */
export async function getERC721TokenMetadata(
	tokenAddress: Address,
	tokenId: bigint,
	network = DEFAULT_NETWORK
): Promise<{
	name: string;
	symbol: string;
	tokenURI: string;
}> {
	const publicClient = getPublicClient(network);

	const contract = getContract({
		address: tokenAddress,
		abi: erc721Abi,
		client: publicClient
	});

	const [name, symbol, tokenURI] = await Promise.all([contract.read.name(), contract.read.symbol(), contract.read.tokenURI([tokenId])]);

	return {
		name,
		symbol,
		tokenURI
	};
}

/**
 * Get ERC1155 token URI
 */
export async function getERC1155TokenURI(tokenAddress: Address, tokenId: bigint, network = DEFAULT_NETWORK): Promise<string> {
	const publicClient = getPublicClient(network);

	const contract = getContract({
		address: tokenAddress,
		abi: erc1155Abi,
		client: publicClient
	});

	return contract.read.uri([tokenId]);
}

/**
 * Check if an address owns a specific NFT
 */
export async function isNFTOwner(tokenAddress: string, ownerAddress: string, tokenId: bigint, network = DEFAULT_NETWORK): Promise<boolean> {
	const validatedTokenAddress = services.helpers.validateAddress(tokenAddress);
	const validatedOwnerAddress = services.helpers.validateAddress(ownerAddress);

	try {
		const actualOwner = (await readContract(
			{
				address: validatedTokenAddress,
				abi: erc721Abi,
				functionName: 'ownerOf',
				args: [tokenId]
			},
			network
		)) as Address;

		return actualOwner.toLowerCase() === validatedOwnerAddress.toLowerCase();
	} catch (error: unknown) {
		console.error(`Error checking NFT ownership: ${error instanceof Error ? error.message : String(error)}`);
		return false;
	}
}
