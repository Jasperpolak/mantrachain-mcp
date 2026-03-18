// Canonical token contract addresses for MANTRA Chain
// Source: https://docs.mantrachain.io/resources/canonical-token-contracts

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

const MAINNET_TOKENS: TokenInfo[] = [
  { symbol: 'wMANTRA', name: 'Wrapped MANTRA', address: '0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598', decimals: 18 },
  { symbol: 'stMANTRA', name: 'Staked MANTRA (Fluxtra)', address: '0x4131a80b67BE287627766B858C3C6d7f9e900324', decimals: 18 },
  { symbol: 'mantraUSD', name: 'MANTRA Stablecoin', address: '0xd2b95283011E47257917770D28Bb3EE44c849f6F', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x5E76be0F4e09057D75140216F70fd4cE3365bb29', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0x3806640578b710d8480910bF51510bc538d2F51A', decimals: 6 },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', address: '0xABb5E5b46112Ca652481d1117459dc289a1Ee282', decimals: 8 },
  { symbol: 'wETH', name: 'Wrapped Ethereum', address: '0xa901E6974C8F0fCc2f44451B0e788CD6957E02E2', decimals: 18 },
  { symbol: 'HYPE', name: 'HYPE Token', address: '0x2d01885f395186903ac76D0C67b94f1F8BcE6727', decimals: 18 },
];

const TESTNET_TOKENS: TokenInfo[] = [
  { symbol: 'wMANTRA', name: 'Wrapped MANTRA', address: '0x10d26F0491fA11c5853ED7C1f9817b098317DC46', decimals: 18 },
  { symbol: 'stMANTRA', name: 'Staked MANTRA (Fluxtra)', address: '0xF8111a944b4cde4Cd05D4Fc07098e7492BEE22a7', decimals: 18 },
  { symbol: 'mantraUSD', name: 'MANTRA Stablecoin', address: '0x4B545d0758eda6601B051259bD977125fbdA7ba2', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x49b163c575948F0b95e0c459C301995147f27866', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', address: '0x21E56013a76a7F1F86cF7ee95c0a5670C7b7e44D', decimals: 6 },
];

const REGISTRY: Record<string, TokenInfo[]> = {
  'mantra-1': MAINNET_TOKENS,
  'mantra-dukong-1': TESTNET_TOKENS,
};

export function getTokenBySymbol(symbol: string, networkName: string): TokenInfo | undefined {
  const tokens = REGISTRY[networkName];
  if (!tokens) return undefined;
  return tokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
}

export function getAllTokens(networkName: string): TokenInfo[] {
  return REGISTRY[networkName] || [];
}
