// Shared ABI definitions for ERC token standards
// Each ABI is a superset covering both balance and metadata use cases

export const erc20Abi = [
	{
		inputs: [],
		name: 'name',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ type: 'uint8' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'totalSupply',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'address', name: 'account' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export const erc721Abi = [
	{
		inputs: [],
		name: 'name',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'address', name: 'owner' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'tokenId' }],
		name: 'ownerOf',
		outputs: [{ type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'tokenId' }],
		name: 'tokenURI',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

export const erc1155Abi = [
	{
		inputs: [
			{ type: 'address', name: 'account' },
			{ type: 'uint256', name: 'id' }
		],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'id' }],
		name: 'uri',
		outputs: [{ type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// Beefy CLM vault ABI (used by Fluxtra vaults on MANTRA Chain)
export const beefyCLMVaultAbi = [
	{
		inputs: [],
		name: 'wants',
		outputs: [{ type: 'address' }, { type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'balances',
		outputs: [{ type: 'uint256' }, { type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'totalSupply',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'address', name: 'account' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'shares' }],
		name: 'previewWithdraw',
		outputs: [{ type: 'uint256' }, { type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// Algebra Integral NonfungiblePositionManager ABI
export const algebraPositionManagerAbi = [
	{
		inputs: [{ type: 'address', name: 'owner' }],
		name: 'balanceOf',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ type: 'address', name: 'owner' },
			{ type: 'uint256', name: 'index' }
		],
		name: 'tokenOfOwnerByIndex',
		outputs: [{ type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ type: 'uint256', name: 'tokenId' }],
		name: 'positions',
		outputs: [
			{ type: 'uint96', name: 'nonce' },
			{ type: 'address', name: 'operator' },
			{ type: 'address', name: 'token0' },
			{ type: 'address', name: 'token1' },
			{ type: 'address', name: 'deployer' },
			{ type: 'int24', name: 'tickLower' },
			{ type: 'int24', name: 'tickUpper' },
			{ type: 'uint128', name: 'liquidity' },
			{ type: 'uint256', name: 'feeGrowthInside0LastX128' },
			{ type: 'uint256', name: 'feeGrowthInside1LastX128' },
			{ type: 'uint128', name: 'tokensOwed0' },
			{ type: 'uint128', name: 'tokensOwed1' }
		],
		stateMutability: 'view',
		type: 'function'
	}
] as const;
