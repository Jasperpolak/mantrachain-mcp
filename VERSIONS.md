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

## v0.3 — Roadmap

Driven by gaps identified in Octavio's test report. The main theme is **indexed data** — things that standard RPC nodes can't provide natively.

### High priority: EVM tx history by address
- Standard EVM RPC has no `eth_getTransactionsByAddress` equivalent
- MantraScan does not have a public API
- Options to investigate:
  - **Blockscout** — open-source explorer with REST + GraphQL APIs. Check if MANTRA runs one or if we can point to a public instance.
  - **The Graph** — decentralized indexing. Check for existing MANTRA subgraphs or feasibility of deploying one.
  - **Custom indexer** — lightweight service that listens to new blocks and indexes tx sender/recipient. Most control, most effort.
  - **Covalent / Alchemy / similar** — third-party indexed APIs. Check MANTRA chain support.

### Token enumeration per wallet
- List all ERC-20 tokens held by an address (not just query a known token)
- Requires indexed data — same investigation as tx history

### Holder lists
- List all holders of a given ERC-20 token
- Requires Transfer event indexing or a third-party API

### LP position enumeration
- List all LP positions for an address across DEX pools
- Requires knowledge of pool contract interfaces and position tracking

### Other items from feedback
- Symbol-to-address resolution (Claude currently hallucinates a `get_token_info_by_symbol` tool that doesn't exist). Could add a hardcoded registry of known MANTRA chain tokens.
- Algebra/concentrated liquidity pool introspection (tick state, price ranges) — depends on contract ABI availability
- Vault underlying amount queries — each vault has custom methods, hard to support generically

### Context for the next agent
- The Notion test report from Octavio is the primary source of truth for what users tried and what failed: `https://www.notion.so/Mantrachain-MCP-Capability-Feedback-3275c45f06f08124b26eee8eb0d47f3b`
- The MCP is deployed on Cloud Run at `https://mantrachain-mcp-363874984344.europe-west1.run.app/mcp`
- All tools are read-only. No signing, no wallets, no state changes.
- The codebase is TypeScript, uses the MCP SDK (`@modelcontextprotocol/sdk`), viem for EVM, and CosmJS for Cosmos.
