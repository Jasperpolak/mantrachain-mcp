# MANTRA Chain MCP v0.4 — Test Script

Use this in a clean Cowork window connected to the MANTRA Chain MCP. Disconnect and reconnect the connector first to pick up the new tools, then start a fresh conversation. Run each test and note whether it passes or fails.

**Total tests:** 40 (22 regression + 18 new)

**Test addresses:**
- Cosmos wallet: `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`
- EVM EOA with tokens: `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`
- EVM wallet (Octavio's): `0x3741c09d1A988b47A54B25AA7D7D2a749737f0fA`
- EVM contract (wMANTRA): `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`
- NFT contract (OMIES): `0x8d356C20dB4BaB3F6e562c5C76804D963dDAd862`
- NFT contract (Loki): `0x5417c5E2f53cb522a80c5Ac06ee5e9c09e72B9d7`

---

# PART A: REGRESSION TESTS (v0.1–v0.3.1)

These tests verify that existing functionality is unchanged.

---

## Test 1: Cosmos balance

> Get the balance for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` on mantra-1.

**Expected:** Returns balance in MANTRA with denomination info. No errors.
**Pass criteria:** Balance returned successfully, shows amount in MANTRA.

---

## Test 2: EVM native balance

> Get the EVM balance for `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns native MANTRA balance for the EVM address.
**Pass criteria:** Balance returned as a number/string with no errors.

---

## Test 3: ERC-20 token balance

> Get the wMANTRA balance for wallet `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` using token contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

**Expected:** Returns raw and formatted balance, symbol, decimals.
**Pass criteria:** All fields present: raw, formatted, symbol (wMANTRA), decimals (18).

---

## Test 4: Staking delegations

> Get the staking delegations for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` on mantra-1.

**Expected:** Returns list of validators and delegation amounts.
**Pass criteria:** At least one delegation returned with validator and amount.

---

## Test 5: Staking rewards

> Get the available staking rewards for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` on mantra-1.

**Expected:** Returns rewards in MANTRA (not inflated by 10^18).
**Pass criteria:** Reward values are in a reasonable human-readable range (not astronomical numbers).

---

## Test 6: Unbonding delegations

> Get the unbonding delegations for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` on mantra-1.

**Expected:** Returns unbonding entries or empty list.
**Pass criteria:** No errors. Returns a valid response (may be empty if nothing is unbonding).

---

## Test 7: Validator list

> List the validators on mantra-1.

**Expected:** Returns full active validator set.
**Pass criteria:** Multiple validators returned with moniker, commission, and delegation info.

---

## Test 8: Cosmos block info (latest)

> Get the latest block info on mantra-1.

**Expected:** Returns block height, timestamp, hash, proposer.
**Pass criteria:** All fields populated. Height is a recent number (>13M).

---

## Test 9: EVM block info (latest)

> Get the latest EVM block info on mantra-1.

**Expected:** Returns block with number, timestamp, hash, transactions.
**Pass criteria:** Block number close to the Cosmos block height.

---

## Test 10: Address conversion (bech32 → EVM)

> Convert the address `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` to EVM format.

**Expected:** Returns both bech32 and EVM (0x...) formats.
**Pass criteria:** Both formats present. EVM address starts with 0x.

---

## Test 11: Token info by symbol

> Look up the token info for symbol "USDC" on mantra-1.

**Expected:** Returns contract address, name, decimals for USDC.
**Pass criteria:** Returns a valid contract address and decimals (6 for USDC).

---

## Test 12: Token info by symbol (HYPE)

> Look up the token info for symbol "HYPE" on mantra-1.

**Expected:** Returns contract address for HYPE token.
**Pass criteria:** Returns `0x2d01885f...` with 18 decimals. (v0.3.1 fix verification)

---

## Test 13: Chain stats

> Get the chain stats for MANTRA Chain.

**Expected:** All fields present including `average_block_time_ms`.
**Pass criteria:** Field is `average_block_time_ms` (NOT `average_block_time`). Value ~3000–4000. All other fields populated.

---

## Test 14: EVM tx history with method_id

> Show me the EVM transaction history for `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns 50 txs with `method_id` field on each.
**Pass criteria:** All v0.3 fields present (hash, block_number, from, to, value, status, etc.) PLUS `method_id`. Pagination cursor present.

---

## Test 15: Token list without limit

> List all tokens held by `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns all tokens. `token_count` equals `total_available`.
**Pass criteria:** Both fields present and equal. Multiple tokens returned.

---

## Test 16: Token list with limit

> List all tokens held by `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1, but limit to 1 result.

**Expected:** `token_count` = 1, `total_available` > 1.
**Pass criteria:** Only 1 token returned. `total_available` shows the full count.

---

## Test 17: Token holders

> List the holders of token `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

**Expected:** Returns list of holder addresses with balances.
**Pass criteria:** Multiple holders returned. Each has address, value, is_contract fields.

---

## Test 18: Token transfer history

> Get the token transfer history for `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns ERC-20/721/1155 transfers with tx hash, from, to, token info.
**Pass criteria:** Multiple transfers returned. Token symbols and amounts present.

---

## Test 19: Address info

> Get the address info for `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

**Expected:** Returns address profile including is_contract, is_verified, coin_balance, token info.
**Pass criteria:** `is_contract: true`. Token info present (wMANTRA). Creator address shown.

---

## Test 20: Cosmos tx by hash

> Get the Cosmos transaction with hash `B2F38F8F9A7D6D55D42F101A7F6C33C1E07F13E52345F1A0DCF38B2B2D3F2E5A` on mantra-1.

**Expected:** Returns transaction data or a clean "not found" error.
**Pass criteria:** No unhandled exceptions. Either returns tx data or a clear error message.

---

## Test 21: CosmWasm contract query

> Query the DEX contract `mantra1466nf3zuxpya8q9emxukd7vftaf6h4psr0a07srl5zw74zh84yjqagspfm` on mantra-1 with the query message `{"pools": {}}`.

**Expected:** Returns list of DEX pools.
**Pass criteria:** Returns pool data with token pairs and liquidity info.

---

## Test 22: DEX pools

> List all DEX pools on mantra-1.

**Expected:** Returns all MANTRA DEX liquidity pools.
**Pass criteria:** Multiple pools returned with asset denoms and fee info.

---

# PART B: v0.4 NEW FEATURES

---

## B1. TOKEN LIST TYPE FILTER

---

## Test 23: Token list filtered by ERC-20

> List only the ERC-20 tokens held by `0x3741c09d1A988b47A54B25AA7D7D2a749737f0fA` on mantra-1, filtering by type ERC-20.

**Expected:** Only ERC-20 tokens returned. No ERC-721 or ERC-1155 tokens.
**Pass criteria:** Every token in the response has `type: "ERC-20"`. No NFTs present.

---

## Test 24: Token list filtered by ERC-721

> List only the ERC-721 tokens held by `0x3741c09d1A988b47A54B25AA7D7D2a749737f0fA` on mantra-1, filtering by type ERC-721.

**Expected:** Only ERC-721 tokens returned.
**Pass criteria:** Every token in the response has `type: "ERC-721"`. No ERC-20 tokens present.

---

## Test 25: Token list with type filter + limit combined

> List only the ERC-20 tokens held by `0x3741c09d1A988b47A54B25AA7D7D2a749737f0fA` on mantra-1, filtering by type ERC-20, limit to 2 results.

**Expected:** Max 2 ERC-20 tokens returned. `total_available` shows how many ERC-20 tokens exist.
**Pass criteria:** `token_count` ≤ 2. All returned tokens are type ERC-20. `total_available` may be larger.

---

## B2. ARCHIVE NODE FALLBACK (PRUNED BLOCKS)

---

## Test 26: EVM block info for a pruned block

> Get the EVM block info for block 10000000 on mantra-1.

**Expected:** Returns block data from the archive node. Block 10M is above EVM activation (8,618,888) but below the pruning floor (~13.15M), so the standard RPC can't serve it but the archive node can.
**Pass criteria:** Returns a valid block with timestamp, hash, and transactions. No "header not found" error.

---

## Test 27: EVM block info for a recent block (no fallback needed)

> Get the EVM block info for block 13300000 on mantra-1.

**Expected:** Returns block data from the standard RPC (above pruning floor).
**Pass criteria:** Returns a valid block. This verifies the archive fallback doesn't break normal queries.

---

## Test 28: Read contract at a pruned block

> Read the `totalSupply` function on wMANTRA contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` at block 12000000 on mantra-1. Use ABI: `[{"inputs":[],"name":"totalSupply","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]`

**Expected:** Returns the totalSupply at block 12M via archive node fallback.
**Pass criteria:** Returns a numeric value. No "header not found" error.

---

## Test 29: Get transaction receipt for a pruned-block tx

> Get the transaction receipt for `0x7f1a43adda2e1e12fee1fdde93e44e3f9f63aefe1c5ce8f35a9798ed5e4dbb27` on mantra-1.

**Expected:** If this tx exists in the pruned range, it should be retrieved via archive fallback. If the hash doesn't exist, a clean error.
**Pass criteria:** Either returns valid receipt data OR a clean error message — NOT a raw "header not found" error.

---

## B3. PRE-EVM COSMOS REROUTE (BLOCKS < 8,618,888)

---

## Test 30: EVM block info for a pre-EVM block

> Get the EVM block info for block 5000000 on mantra-1.

**Expected:** Since EVM didn't exist at block 5M, the MCP should automatically return Cosmos CometBFT block data with a note explaining the reroute.
**Pass criteria:** Response contains `_note` mentioning EVM activation at block 8,618,888. Contains Cosmos block data (height, timestamp). Source is `cosmos_cometbft`. NOT an error.

---

## Test 31: EVM block info for block 1 (genesis)

> Get the EVM block info for block 1 on mantra-1.

**Expected:** Returns Cosmos genesis block data with a reroute note.
**Pass criteria:** Returns block data for height 1. Timestamp should be around October 2024 (genesis). `_note` present explaining the reroute.

---

## Test 32: EVM block info for block 8618887 (last pre-EVM block)

> Get the EVM block info for block 8618887 on mantra-1.

**Expected:** This is the last block before EVM activation. Should return Cosmos data with reroute note.
**Pass criteria:** Returns Cosmos block data. `_note` references EVM activation.

---

## Test 33: EVM block info for block 8618888 (first EVM block)

> Get the EVM block info for block 8618888 on mantra-1.

**Expected:** This IS the EVM activation block. Should return EVM block data (possibly via archive fallback since it's below the pruning floor).
**Pass criteria:** Returns EVM block data. NO reroute note. Archive fallback may be used silently.

---

## Test 34: Read contract at pre-EVM block

> Read the `totalSupply` function on wMANTRA contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` at block 5000000 on mantra-1. Use ABI: `[{"inputs":[],"name":"totalSupply","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]`

**Expected:** Definitive message that no EVM contract state exists before block 8,618,888.
**Pass criteria:** Response contains `pre_evm_block` error type and mentions Abunnati upgrade. NOT a cryptic RPC error.

---

## Test 35: EVM logs for a pre-EVM range

> Get EVM logs from block 1000000 to block 2000000 on mantra-1.

**Expected:** Definitive message that no EVM logs exist before block 8,618,888.
**Pass criteria:** Response mentions `pre_evm_block` and the EVM activation boundary. NOT a raw RPC error.

---

## Test 36: EVM logs spanning the EVM activation boundary

> Get EVM logs for contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` from block 8000000 to block 9000000 on mantra-1.

**Expected:** The range starts before EVM activation (8M) and ends after (9M). The MCP should automatically adjust `fromBlock` to 8,618,888 and return whatever logs exist in the valid range.
**Pass criteria:** Returns log data (possibly empty) without errors. The fromBlock is silently adjusted — no pre-EVM error thrown since the range partially overlaps with EVM.

---

## B4. INTERNAL TRANSACTIONS

---

## Test 37: Internal transactions for an active address

> Get the internal EVM transactions for `0x3741c09d1A988b47A54B25AA7D7D2a749737f0fA` on mantra-1.

**Expected:** Returns internal (contract-initiated) transactions with type, from, to, value, transaction_hash.
**Pass criteria:** Response contains `internal_transactions` array. Each entry has `transaction_hash`, `from`, `to`, `type`. `next_page_params` present if more pages exist.

---

## Test 38: Internal transactions for a contract address

> Get the internal EVM transactions for `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

**Expected:** Returns internal calls to/from the wMANTRA contract.
**Pass criteria:** Returns internal transactions. May include `type` values like "call", "create", "delegatecall".

---

## B5. NFT INFO BLOCKSCOUT FALLBACK

---

## Test 39: NFT info for non-standard contract (OMIES)

> Get the NFT info for token ID "1" on contract `0x8d356C20dB4BaB3F6e562c5C76804D963dDAd862` on mantra-1.

**Expected:** Direct contract call will fail (non-standard ERC-721). MCP should fall back to Blockscout and return whatever metadata is available.
**Pass criteria:** Returns data with `source: "blockscout"` and `_note` mentioning the fallback. NOT a raw "execution reverted" error. May include token name, metadata, owner, image URL from Blockscout indexer.

---

## Test 40: NFT info for non-standard contract (Loki)

> Get the NFT info for token ID "1" on contract `0x5417c5E2f53cb522a80c5Ac06ee5e9c09e72B9d7` on mantra-1.

**Expected:** Same as Test 39 — direct call fails, Blockscout fallback returns data.
**Pass criteria:** Returns data with `source: "blockscout"`. NOT a raw error. If Blockscout also doesn't have the data, returns a clear combined error message mentioning both attempts.

---

# RESULTS SUMMARY

| # | Test | Result |
|---|------|--------|
| 1 | Cosmos balance | |
| 2 | EVM native balance | |
| 3 | ERC-20 token balance | |
| 4 | Staking delegations | |
| 5 | Staking rewards | |
| 6 | Unbonding delegations | |
| 7 | Validator list | |
| 8 | Cosmos block info (latest) | |
| 9 | EVM block info (latest) | |
| 10 | Address conversion | |
| 11 | Token info by symbol (USDC) | |
| 12 | Token info by symbol (HYPE) | |
| 13 | Chain stats | |
| 14 | EVM tx history with method_id | |
| 15 | Token list without limit | |
| 16 | Token list with limit | |
| 17 | Token holders | |
| 18 | Token transfer history | |
| 19 | Address info | |
| 20 | Cosmos tx by hash | |
| 21 | CosmWasm contract query | |
| 22 | DEX pools | |
| 23 | Token list filter: ERC-20 | |
| 24 | Token list filter: ERC-721 | |
| 25 | Token list filter + limit | |
| 26 | Archive: EVM block 10M | |
| 27 | Recent block (no fallback) | |
| 28 | Archive: contract read at 12M | |
| 29 | Archive: tx receipt (pruned) | |
| 30 | Pre-EVM: block 5M reroute | |
| 31 | Pre-EVM: block 1 (genesis) | |
| 32 | Pre-EVM: block 8618887 (boundary) | |
| 33 | EVM activation: block 8618888 | |
| 34 | Pre-EVM: contract read | |
| 35 | Pre-EVM: EVM logs | |
| 36 | EVM logs spanning boundary | |
| 37 | Internal txs: EOA | |
| 38 | Internal txs: contract | |
| 39 | NFT info: OMIES (fallback) | |
| 40 | NFT info: Loki (fallback) | |

---

*Test script for MANTRA Chain MCP v0.4 — March 2026*
