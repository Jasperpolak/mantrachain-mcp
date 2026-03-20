import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address, getAddress } from 'viem';
import * as services from '../evm-services/index.js';
import { erc721Abi } from '../evm-services/abis.js';
import { MantraClient } from '../mantra-client.js';
import { networkNameSchema, formatError } from './schemas.js';

/** Safely normalize an address to EIP-55 checksum. Returns null if invalid. */
function safeChecksum(addr: string): Address | null {
	try {
		return getAddress(addr);
	} catch {
		return null;
	}
}

export function registerTokenTools(server: McpServer, mantraClient: MantraClient) {
	// Get NFT (ERC721) information — with Blockscout fallback
	server.tool(
		'get_nft_info',
		'Get detailed information about a specific NFT (ERC721 token), including collection name, symbol, token URI, and current owner if available. Falls back to Blockscout if the contract uses a non-standard interface.',
		{
			tokenAddress: z.string().describe("The contract address of the NFT collection (e.g., '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D')"),
			tokenId: z.string().describe("The ID of the specific NFT token to query (e.g., '1234')"),
			networkName: networkNameSchema,
		},
		async ({ tokenAddress, tokenId, networkName }) => {
			// Normalize address to EIP-55 checksum
			const checksummed = safeChecksum(tokenAddress);
			if (!checksummed) {
				return {
					content: [{type: 'text', text: `Error: invalid EVM address: ${tokenAddress}`}],
					isError: true
				};
			}

			// Try direct contract call first
			try {
				const nftInfo = await services.getERC721TokenMetadata(checksummed, BigInt(tokenId), networkName);

				let owner: `0x${string}` | null = null;
				try {
					owner = await services.getPublicClient(networkName).readContract({
						address: checksummed,
						abi: erc721Abi,
						functionName: 'ownerOf',
						args: [BigInt(tokenId)]
					});
				} catch (e) {
					// Ownership info not available
				}

				return {
					content: [{
						type: 'text',
						text: JSON.stringify({ contract: checksummed, tokenId, network: networkName, ...nftInfo, owner: owner || 'Unknown' }, null, 2)
					}]
				};
			} catch (directError) {
				// Fallback to Blockscout — try instance first, then token-level info
				try {
					await mantraClient.initialize(networkName);

					let instance: any = null;
					let tokenInfo: any = null;

					// Try specific NFT instance
					try {
						instance = await mantraClient.getNFTInstance(checksummed, tokenId);
					} catch {
						// Instance not found — try token-level info
						try {
							tokenInfo = await mantraClient.getTokenInfo(checksummed);
						} catch {
							// Token also not indexed on Blockscout
						}
					}

					if (instance) {
						const result: any = {
							contract: checksummed,
							tokenId,
							network: networkName,
							source: 'blockscout',
							_note: 'Direct contract call failed (non-standard ERC-721 interface). Data retrieved via Blockscout indexer.',
						};

						if (instance.token) {
							result.name = instance.token.name;
							result.symbol = instance.token.symbol;
							result.type = instance.token.type;
							result.total_supply = instance.token.total_supply;
							result.holders_count = instance.token.holders_count;
						}

						if (instance.metadata) {
							result.metadata = instance.metadata;
						}

						result.image_url = instance.image_url || null;
						result.animation_url = instance.animation_url || null;
						result.external_app_url = instance.external_app_url || null;
						result.owner = instance.owner?.hash || 'Unknown';

						return {
							content: [{
								type: 'text',
								text: JSON.stringify(result, null, 2)
							}]
						};
					}

					if (tokenInfo) {
						return {
							content: [{
								type: 'text',
								text: JSON.stringify({
									contract: checksummed,
									tokenId,
									network: networkName,
									source: 'blockscout',
									_note: `Direct contract call failed (non-standard ERC-721 interface). Specific token instance #${tokenId} not indexed on Blockscout, but collection-level data was found.`,
									name: tokenInfo.name,
									symbol: tokenInfo.symbol,
									type: tokenInfo.type,
									total_supply: tokenInfo.total_supply,
									holders_count: tokenInfo.holders_count,
									icon_url: tokenInfo.icon_url || null,
								}, null, 2)
							}]
						};
					}

					// Neither worked
					return {
						content: [{type: 'text', text: `NFT info unavailable: Direct contract call failed (${formatError(directError)}). This contract is not indexed on Blockscout either. The NFT contract at ${checksummed} may use a non-standard interface that is not compatible with ERC-721 metadata queries.`}],
						isError: true
					};
				} catch (blockscoutError) {
					return {
						content: [{type: 'text', text: `NFT info unavailable: Direct contract call failed (${formatError(directError)}). Blockscout fallback also failed (${formatError(blockscoutError)}). The NFT contract at ${checksummed} may use a non-standard interface.`}],
						isError: true
					};
				}
			}
		}
	);

	// Check NFT ownership
	server.tool(
		'check_nft_ownership',
		'Check if an address owns a specific NFT',
		{
			tokenAddress: z.string().describe("The contract address of the NFT collection (e.g., '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D')"),
			tokenId: z.string().describe("The ID of the NFT to check (e.g., '1234')"),
			ownerAddress: z.string().describe("The wallet address to check ownership against (e.g., '0x1234...')"),
			networkName: networkNameSchema,
		},
		async ({ tokenAddress, tokenId, ownerAddress, networkName }) => {
			try {
				const isOwner = await services.isNFTOwner(tokenAddress, ownerAddress, BigInt(tokenId), networkName);
				return {
					content: [{
						type: 'text',
						text: JSON.stringify({
							tokenAddress, tokenId, ownerAddress, network: networkName,
							isOwner,
							result: isOwner ? 'Address owns this NFT' : 'Address does not own this NFT'
						}, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{type: 'text', text: `Error checking NFT ownership: ${formatError(error)}`}],
					isError: true
				};
			}
		}
	);

	// Get ERC1155 token URI
	server.tool(
		'get_erc1155_token_uri',
		'Get the metadata URI for an ERC1155 token (multi-token standard used for both fungible and non-fungible tokens). The URI typically points to JSON metadata about the token.',
		{
			tokenAddress: z.string().describe("The contract address of the ERC1155 token collection (e.g., '0x5B6D32f2B55b62da7a8cd553857EB6Dc26bFDC63')"),
			tokenId: z.string().describe("The ID of the specific token to query metadata for (e.g., '1234')"),
			networkName: networkNameSchema,
		},
		async ({ tokenAddress, tokenId, networkName }) => {
			try {
				const uri = await services.getERC1155TokenURI(tokenAddress as Address, BigInt(tokenId), networkName);
				return {
					content: [{
						type: 'text',
						text: JSON.stringify({ contract: tokenAddress, tokenId, network: networkName, uri }, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{type: 'text', text: `Error fetching ERC1155 token URI: ${formatError(error)}`}],
					isError: true
				};
			}
		}
	);

	// Get ERC20 token information
	server.tool(
		'get_erc20_token_info',
		'Get comprehensive information about an ERC20 token including name, symbol, decimals, total supply, and other metadata. Use this to analyze any token on EVM chains.',
		{
			tokenAddress: z.string().describe("The contract address of the ERC20 token (e.g., '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')"),
			networkName: networkNameSchema,
		},
		async ({ tokenAddress, networkName }) => {
			try {
				const tokenInfo = await services.getERC20TokenInfo(tokenAddress as Address, networkName);
				return {
					content: [{
						type: 'text',
						text: JSON.stringify({ address: tokenAddress, network: networkName, ...tokenInfo }, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{type: 'text', text: `Error fetching token info: ${formatError(error)}`}],
					isError: true
				};
			}
		}
	);
}
