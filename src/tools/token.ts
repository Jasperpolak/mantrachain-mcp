import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type Address, getAddress, formatUnits } from 'viem';
import * as services from '../evm-services/index.js';
import { erc20Abi, erc721Abi, beefyCLMVaultAbi, algebraPositionManagerAbi } from '../evm-services/abis.js';
import { MantraClient } from '../mantra-client.js';
import { networkNameSchema, formatError } from './schemas.js';
import { networks } from '../config.js';

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

			// Pre-check: verify the address is actually a contract
			try {
				const code = await services.getPublicClient(networkName).getCode({ address: checksummed });
				if (!code || code === '0x') {
					return {
						content: [{
							type: 'text',
							text: JSON.stringify({
								error: 'not_a_contract',
								address: checksummed,
								message: `Address ${checksummed} is an EOA (externally owned account), not an NFT contract. Verify the contract address.`,
							}, null, 2)
						}],
						isError: true
					};
				}
			} catch {
				// getCode failed — proceed anyway, the contract call will give a more specific error
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

	// Get vault underlying token amounts (Beefy CLM / Fluxtra vaults)
	server.tool(
		'get_vault_underlying',
		'Get the underlying token composition of a Beefy CLM vault (e.g., Fluxtra vaults on MANTRA Chain). Returns the two underlying tokens, total amounts held by the vault, and optionally a specific user\'s share value. Use this to understand what tokens are inside a vault and how much they are worth.',
		{
			vaultAddress: z.string().describe("The vault contract address (e.g., '0xbF53F231eac37b1Fe3b8aAF2e4963f89fB7790d0')"),
			ownerAddress: z.string().optional().describe("Optional wallet address to also show that user's share balance and underlying value"),
			networkName: networkNameSchema,
		},
		async ({ vaultAddress, ownerAddress, networkName }) => {
			const vault = safeChecksum(vaultAddress);
			if (!vault) {
				return { content: [{ type: 'text', text: `Error: invalid vault address: ${vaultAddress}` }], isError: true };
			}

			try {
				const client = services.getPublicClient(networkName);

				// Fetch vault state in parallel
				const [wantsResult, balancesResult, totalSupplyResult] = await Promise.all([
					client.readContract({ address: vault, abi: beefyCLMVaultAbi, functionName: 'wants' }),
					client.readContract({ address: vault, abi: beefyCLMVaultAbi, functionName: 'balances' }),
					client.readContract({ address: vault, abi: beefyCLMVaultAbi, functionName: 'totalSupply' }),
				]);

				const token0Addr = (wantsResult as [Address, Address])[0];
				const token1Addr = (wantsResult as [Address, Address])[1];
				const [bal0, bal1] = balancesResult as [bigint, bigint];
				const totalSupply = totalSupplyResult as bigint;

				// Resolve token metadata in parallel
				const [name0, symbol0, decimals0, name1, symbol1, decimals1] = await Promise.all([
					client.readContract({ address: token0Addr, abi: erc20Abi, functionName: 'name' }),
					client.readContract({ address: token0Addr, abi: erc20Abi, functionName: 'symbol' }),
					client.readContract({ address: token0Addr, abi: erc20Abi, functionName: 'decimals' }),
					client.readContract({ address: token1Addr, abi: erc20Abi, functionName: 'name' }),
					client.readContract({ address: token1Addr, abi: erc20Abi, functionName: 'symbol' }),
					client.readContract({ address: token1Addr, abi: erc20Abi, functionName: 'decimals' }),
				]);

				const d0 = decimals0 as number;
				const d1 = decimals1 as number;

				const result: any = {
					vault: vault,
					network: networkName,
					token0: { address: token0Addr, name: name0, symbol: symbol0, decimals: d0 },
					token1: { address: token1Addr, name: name1, symbol: symbol1, decimals: d1 },
					totalUnderlying: {
						token0: formatUnits(bal0, d0),
						token1: formatUnits(bal1, d1),
					},
					totalShares: formatUnits(totalSupply, 18),
				};

				// If owner specified, fetch their position
				if (ownerAddress) {
					const owner = safeChecksum(ownerAddress);
					if (!owner) {
						return { content: [{ type: 'text', text: `Error: invalid owner address: ${ownerAddress}` }], isError: true };
					}

					const userShares = await client.readContract({
						address: vault, abi: beefyCLMVaultAbi, functionName: 'balanceOf', args: [owner]
					}) as bigint;

					result.user = {
						address: owner,
						shares: formatUnits(userShares, 18),
					};

					if (userShares > 0n) {
						try {
							const preview = await client.readContract({
								address: vault, abi: beefyCLMVaultAbi, functionName: 'previewWithdraw', args: [userShares]
							}) as [bigint, bigint];
							result.user.underlying = {
								token0: formatUnits(preview[0], d0),
								token1: formatUnits(preview[1], d1),
							};
						} catch {
							// previewWithdraw may not be available on all vaults
							// Fall back to proportional calculation
							if (totalSupply > 0n) {
								result.user.underlying = {
									token0: formatUnits(bal0 * userShares / totalSupply, d0),
									token1: formatUnits(bal1 * userShares / totalSupply, d1),
								};
								result.user._note = 'Underlying estimated via proportional share (previewWithdraw unavailable)';
							}
						}
					} else {
						result.user.underlying = { token0: '0', token1: '0' };
					}
				}

				return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
			} catch (error) {
				return {
					content: [{ type: 'text', text: `Error reading vault: ${formatError(error)}. Ensure the address is a Beefy CLM vault contract.` }],
					isError: true
				};
			}
		}
	);

	// Enumerate Algebra DEX LP positions for a wallet
	server.tool(
		'get_lp_positions',
		'List all Algebra DEX liquidity positions (LP NFTs) owned by a wallet on MANTRA Chain. Returns position token IDs, token pairs, tick ranges, liquidity amounts, and uncollected fees. Use this to see all LP positions a wallet holds.',
		{
			ownerAddress: z.string().describe("The wallet address to enumerate LP positions for (e.g., '0xC759...')"),
			networkName: networkNameSchema,
		},
		async ({ ownerAddress, networkName }) => {
			const owner = safeChecksum(ownerAddress);
			if (!owner) {
				return { content: [{ type: 'text', text: `Error: invalid address: ${ownerAddress}` }], isError: true };
			}

			const config = networks[networkName];
			if (!config?.algebraPositionManager) {
				return {
					content: [{ type: 'text', text: `Algebra position manager not configured for network ${networkName}. This tool is available on mantra-1 mainnet.` }],
					isError: true
				};
			}

			const positionManager = config.algebraPositionManager as Address;
			const client = services.getPublicClient(networkName);

			try {
				// Get position count
				const balanceResult = await client.readContract({
					address: positionManager, abi: algebraPositionManagerAbi, functionName: 'balanceOf', args: [owner]
				});
				const positionCount = Number(balanceResult as bigint);

				if (positionCount === 0) {
					return {
						content: [{ type: 'text', text: JSON.stringify({
							owner, network: networkName, positionCount: 0, positions: [],
							message: 'This address holds no Algebra DEX LP positions.'
						}, null, 2) }]
					};
				}

				// Fetch all token IDs in parallel
				const tokenIdPromises = Array.from({ length: positionCount }, (_, i) =>
					client.readContract({
						address: positionManager, abi: algebraPositionManagerAbi,
						functionName: 'tokenOfOwnerByIndex', args: [owner, BigInt(i)]
					})
				);
				const tokenIds = (await Promise.all(tokenIdPromises)) as bigint[];

				// Fetch all position data in parallel
				const positionPromises = tokenIds.map(id =>
					client.readContract({
						address: positionManager, abi: algebraPositionManagerAbi,
						functionName: 'positions', args: [id]
					})
				);
				const positionsRaw = await Promise.all(positionPromises);

				// Collect unique token addresses for metadata resolution
				const tokenAddrs = new Set<string>();
				for (const pos of positionsRaw) {
					const p = pos as unknown as any[];
					tokenAddrs.add(p[2]); // token0
					tokenAddrs.add(p[3]); // token1
				}

				// Resolve token metadata in parallel
				const tokenMeta = new Map<string, { name: string; symbol: string; decimals: number }>();
				const metaPromises = Array.from(tokenAddrs).map(async (addr) => {
					try {
						const [name, symbol, decimals] = await Promise.all([
							client.readContract({ address: addr as Address, abi: erc20Abi, functionName: 'name' }),
							client.readContract({ address: addr as Address, abi: erc20Abi, functionName: 'symbol' }),
							client.readContract({ address: addr as Address, abi: erc20Abi, functionName: 'decimals' }),
						]);
						tokenMeta.set(addr, { name: name as string, symbol: symbol as string, decimals: decimals as number });
					} catch {
						tokenMeta.set(addr, { name: 'Unknown', symbol: '???', decimals: 18 });
					}
				});
				await Promise.all(metaPromises);

				// Format positions
				const positions = positionsRaw.map((pos, i) => {
					const p = pos as unknown as any[];
					const token0Addr = p[2] as string;
					const token1Addr = p[3] as string;
					const t0 = tokenMeta.get(token0Addr)!;
					const t1 = tokenMeta.get(token1Addr)!;

					return {
						tokenId: tokenIds[i].toString(),
						token0: { address: token0Addr, symbol: t0.symbol, decimals: t0.decimals },
						token1: { address: token1Addr, symbol: t1.symbol, decimals: t1.decimals },
						deployer: p[4],
						tickLower: Number(p[5]),
						tickUpper: Number(p[6]),
						liquidity: (p[7] as bigint).toString(),
						tokensOwed0: formatUnits(p[10] as bigint, t0.decimals),
						tokensOwed1: formatUnits(p[11] as bigint, t1.decimals),
					};
				});

				return {
					content: [{ type: 'text', text: JSON.stringify({
						owner, network: networkName, positionManager, positionCount, positions
					}, null, 2) }]
				};
			} catch (error) {
				return {
					content: [{ type: 'text', text: `Error enumerating LP positions: ${formatError(error)}` }],
					isError: true
				};
			}
		}
	);
}
