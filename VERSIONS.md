# MANTRA Chain MCP — Version History & Roadmap

## v0.1 — Initial Release

Read-only MCP server exposing MANTRA Chain data to Claude. 28 tools across 10 modules.

### Balances (5 tools)
- `get-balance` — Cosmos balance for any mantra1... address
- `get_evm_balance` — Native MANTRA balance for any 0x... address
- `get_token_balance` — ERC-20 token balance
- `get_nft_balance` — ERC-721 NFT count per collection
- `get_erc1155_balance` — ERC-1155 token balance by ID

### Staking (3 tools)
- `get-validators` — All active validators with stake info
- `get-delegations` — Active staking delegations for an address
- `get-available-rewards` — Unclaimed staking rewards

### Transactions (6 tools)
- `get_cosmos_tx` — Single Cosmos tx by hash
- `search_cosmos_txs` — Search Cosmos txs by sender, recipient, height, message type
- `get_cosmos_txs_by_address` — All Cosmos txs for an address (sent, received, delegations, rewards)
- `get_transaction` — EVM tx by hash
- `get_transaction_receipt` — EVM tx receipt by hash
- `estimate_gas` — Gas estimation for EVM transactions

### Network & Blocks (3 tools)
- `get-block-info` — Cosmos CometBFT block info (current or historical)
- `get-block-info-evm` — EVM block info (current or historical)
- `query-network` — Generic Cosmos REST/gRPC Gateway queries

### Smart Contracts (3 tools)
- `cosmwasm-contract-query` — Query CosmWasm contracts
- `read_evm_contract` — Read EVM contract state (view/pure functions)
- `is_contract` — Check if an EVM address is a contract or EOA

### DEX (3 tools)
- `dex-get-pools` — All liquidity pools with assets, fees, TVL
- `dex-find-routes` — Swap routes between two tokens
- `dex-simulate-swap` — Simulate a swap without executing

### Tokens & NFTs (4 tools)
- `get_erc20_token_info` — ERC-20 token metadata (name, symbol, decimals, supply)
- `get_nft_info` — ERC-721 NFT metadata and owner
- `check_nft_ownership` — Verify NFT ownership
- `get_erc1155_token_uri` — ERC-1155 metadata URI

### Supply & Price (2 tools)
- `get_token_supply` — Total MANTRA supply on-chain
- `get_token_price` — Current MANTRA price from CoinGecko

### Address Conversion (1 tool)
- `convert_address` — Convert between mantra1... (bech32) and 0x... (EVM) formats

### Known limitations at v0.1
- DEX pool denominations show `uom` instead of `amantra` (chain-level, pre-rename)
- Deep transaction history limited by node pruning; users redirected to MantraScan
- No EVM tx history by address (RPC limitation)

---

## v0.2 — Feedback-Driven Additions

Based on internal testing feedback from Octavio (operations). Added 3 new tools, improved error handling, and fixed a display bug. Total: 31 tools.

### New tools
- `get-unbonding-delegations` — Tokens currently in the unbonding period for an address. Completes the staking picture alongside active delegations and rewards.
- `get_evm_logs` — Query `eth_getLogs` by contract address, block range, and/or event topics. Enables tracking transfers, swaps, and other contract events. Note: RPC nodes typically limit query ranges to ~10k blocks.
- `read_evm_contract` gained a `blockNumber` parameter — Query contract state at any historical block (subject to node archive depth).

### Fixes
- **Rewards display** — Cosmos SDK returns rewards as DecCoins with 18 extra decimal digits of precision. The display was only dividing by 10^18 once instead of twice, showing values ~10^18x too large. Fixed to divide by 10^36 (18 for DecCoin precision + 18 for amantra→MANTRA conversion) using string-based arithmetic to avoid JavaScript Number precision loss.
- **Error handling** — All Cosmos tools (`get-balance`, `get-delegations`, `get-unbonding-delegations`, `get-available-rewards`) now catch RPC errors and return clean, readable messages instead of throwing unhandled exceptions.

### What we learned from testing
- MANTRA mainnet EVM has low but real activity (wMANTRA, mantraUSD, USDC, Uniswap v3-style pools)
- Node archive depth is limited — very old historical reads return "header not found" (expected)
- Block range limits on `eth_getLogs` vary but ~5-10k blocks is safe
- Cowork caches the MCP tool list per session — users must disconnect/reconnect the connector after deploys

---

## v0.3 — Blockscout Integration

Resolved the remaining high-priority gaps from Octavio's test report by integrating the Blockscout v2 REST API at `blockscout.mantrascan.io`. No custom indexer needed — Blockscout already indexes all EVM data on MANTRA Chain. Added 7 new tools. Total: 38 tools.

### New tools (Blockscout-powered)
- `get_evm_txs_by_address` — EVM transaction history for any address. Paginated, includes decoded input, token transfers, gas details. Resolves the #1 gap from v0.2.
- `get_address_token_list` — Enumerate all ERC-20/721/1155 tokens held by a wallet. No pre-known contract list required.
- `get_token_holders` — List all holders of a given ERC-20 token with balances. Enables distribution analysis.
- `get_address_token_transfers` — Token transfer history for an address. Filter by token contract or type (ERC-20/721/1155).
- `get_address_info` — Comprehensive address profile: balance, tx count, contract status, verification, token metadata, creator.
- `get_chain_stats` — MANTRA Chain EVM stats: total txs, addresses, gas prices, MANTRA price, block time, utilization.

### New tool (MCP-only)
- `get_token_info_by_symbol` — Hardcoded registry of canonical MANTRA Chain tokens (wMANTRA, stMANTRA, mantraUSD, USDC, USDT, wBTC, wETH, HYPE). Maps symbol to contract address, name, and decimals. Fixes the hallucination where Claude invents this tool.

### Architecture
- New `BlockscoutService` class wraps all Blockscout v2 API calls (`src/services/blockscout-service.ts`)
- Token registry in `src/token-registry.ts` with mainnet and testnet addresses
- `blockscoutEndpoint` added to `NetworkConfig` (mainnet only for now; testnet TBD)
- No new dependencies — uses native `fetch()`

### Test results (2026-03-18)
28/28 tests passed (17 v2 regression + 11 v3 new tools). Test script: `test-v03.md` in repo root.

Test addresses used:
- Cosmos: `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` (has balance, delegations, rewards)
- EOA with tokens: `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` (holds wMANTRA + USDC, 50+ transfers)
- Contract: `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` (wMANTRA, 42 holders)

### Resolution of Octavio's test report gaps

| Gap from test report | Impact | Status | How |
|---|---|---|---|
| No EVM tx history by address | High | Resolved (v0.3) | `get_evm_txs_by_address` via Blockscout |
| No ERC-20 token enumeration for a wallet | High | Resolved (v0.3) | `get_address_token_list` via Blockscout |
| No historical/snapshot reads | High | Resolved (v0.2) | `blockNumber` param on `read_evm_contract` |
| No unbonding delegations | Medium | Resolved (v0.2) | `get-unbonding-delegations` |
| No event log history by contract | Medium | Resolved (v0.2) | `get_evm_logs` |
| No ERC-20 holder list | Medium | Resolved (v0.3) | `get_token_holders` via Blockscout |
| No symbol-to-address resolution | Medium | Resolved (v0.3) | `get_token_info_by_symbol` (canonical tokens) |
| No DEX trade history for a wallet | Medium | Partially resolved (v0.3) | `get_address_token_transfers` shows swap token movements |
| LP vault underlying token amounts | Medium | Not resolved | Custom ABI per vault — not generalizable |
| Algebra pool: specific LP position | Medium | Not resolved | Needs owner + tick range — Algebra ABI deep-dive |
| No LP position enumeration | Medium | Not resolved | Needs Algebra pool ABI work |
| Cosmos tx history pruning | Medium | Won't fix | Node-level limitation — users redirected to MantraScan |
| No write/execute contract | Low | Won't fix | MCP is read-only by design |
| sqrtPriceX96 price decode accuracy | Low | Not resolved | Nice-to-have, low priority |

**Summary:** 8.5 of 14 gaps resolved across v0.2 and v0.3. All 3 high-priority items done. 3 items are inherently out of scope (node pruning, write tools, price decoding). 2.5 remaining items need Algebra/concentrated liquidity ABI work for a potential v0.4.

---

## v0.3.1 — Octavio Feedback Fixes

Three fixes based on Octavio's "Review Part 2" feedback (2026-03-19). All changes in `src/tools/blockscout.ts`. Total tools unchanged: 38.

### Changes

1. **`average_block_time` → `average_block_time_ms`** — `get_chain_stats` output field renamed to make the unit (milliseconds) self-documenting. Value ~3300 was being misread as seconds. Tool description also updated.

2. **`method_id` added to EVM transaction output** — `get_evm_txs_by_address` now extracts the 4-byte function selector from `raw_input` as a top-level `method_id` field (e.g. `0x93674396`). Present on all contract calls regardless of whether `decoded_input` is available. Null for simple transfers with no calldata.

3. **`limit` parameter on `get_address_token_list`** — Optional client-side limit on the number of tokens returned. Blockscout doesn't support server-side limits on this endpoint, so we fetch then slice. Response includes `total_available` (count before limit) and `token_count` (count after limit). Default (no limit) is unchanged from v0.3.

### Not addressed

- **Transfer `method: null`** — Octavio reported null method fields on some token transfers (e.g. stMANTRA minting). Could not reproduce: Blockscout returns 4-byte selectors on all tested transfers. Asked Octavio for a specific tx hash if it recurs.
- **LP vault/Algebra ABI work** — Deferred to v0.4. Requires per-vault custom ABI integration.

### Test results (2026-03-19)
7/7 tests passed (4 new + 3 regression). Test script: `test-v031.md` in repo root.

---

### Remaining items for future versions
- LP position enumeration — needs Algebra pool ABI deep-dive
- LP vault underlying amounts — custom ABI per vault, not generalizable
- Algebra pool specific position queries — needs owner + tickLower + tickUpper
- sqrtPriceX96 human-readable price decoding — requires token decimal pair knowledge

### Context for the next agent
- The Notion test report from Octavio is the primary source of truth for what users tried and what failed: `https://www.notion.so/Mantrachain-MCP-Capability-Feedback-3275c45f06f08124b26eee8eb0d47f3b`
- The MCP is deployed on Cloud Run at `https://mantrachain-mcp-363874984344.europe-west1.run.app/mcp`
- All tools are read-only. No signing, no wallets, no state changes.
- The codebase is TypeScript, uses the MCP SDK (`@modelcontextprotocol/sdk`), viem for EVM, and CosmJS for Cosmos.
- Blockscout v2 API is at `https://blockscout.mantrascan.io/api/v2` — public, no auth required.
