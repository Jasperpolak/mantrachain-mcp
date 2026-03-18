# MANTRA Chain MCP v0.3 — Test Script

Use this in a clean Cowork window connected to the MANTRA Chain MCP. Run each test and note whether it passes or fails. The first section validates that v2 tools still work; the second tests the new v3 tools.

---

## Part 1: v2 Regression Tests

These confirm that nothing broke from the previous stable version.

### 1.1 Cosmos Balance
> What is the Cosmos balance of `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`?

Expected: Returns a balance in MANTRA with both raw and display amounts.

### 1.2 EVM Balance
> What is the EVM balance of `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`?

Expected: Returns a native MANTRA balance in wei and ether format.

### 1.3 ERC-20 Token Info
> Get the ERC-20 token info for the wMANTRA contract at `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

Expected: Returns name (Wrapped MANTRA), symbol (wMANTRA), decimals (18), total supply.

### 1.4 Staking Delegations
> Show me the staking delegations for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`.

Expected: Returns at least 1 validator delegation with amounts.

### 1.5 Available Rewards
> What are the pending staking rewards for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`?

Expected: Returns rewards in MANTRA with correct precision (not inflated by 10^18).

### 1.6 Unbonding Delegations
> Are there any unbonding delegations for `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`?

Expected: Returns unbonding entries or an empty list — no errors.

### 1.7 Validators
> List the active validators on MANTRA Chain.

Expected: Returns a list of validators sorted by stake.

### 1.8 Block Info (Cosmos)
> What's the latest Cosmos block on MANTRA Chain?

Expected: Returns block height, time, and proposer.

### 1.9 EVM Block Info
> What's the latest EVM block on MANTRA Chain?

Expected: Returns block number, timestamp, gas used.

### 1.10 Contract Check
> Is `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` a contract or an EOA?

Expected: Returns `is_contract: true`.

### 1.11 EVM Contract Read
> Read the `name()` function on the wMANTRA contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`. Use the ABI: `[{"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"stateMutability":"view","type":"function"}]`

Expected: Returns "Wrapped MANTRA".

### 1.12 Cosmos Transaction Search
> Search for Cosmos transactions sent by `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`.

Expected: Returns transactions or a pruning notice — no crashes.

### 1.13 DEX Pools
> List all liquidity pools on the MANTRA DEX.

Expected: Returns pool list with assets and fees.

### 1.14 Token Supply
> What is the total supply of MANTRA?

Expected: Returns total supply in both raw and human-readable format.

### 1.15 Token Price
> What is the current price of MANTRA?

Expected: Returns USD price from CoinGecko.

### 1.16 Address Conversion
> Convert `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk` to an EVM address.

Expected: Returns a 0x... address.

### 1.17 EVM Event Logs
> Get the last 100 blocks of EVM event logs for the wMANTRA contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`.

Expected: Returns log entries or an empty list — no errors.

---

## Part 2: New v0.3 Tools

### 2.1 EVM Transaction History (NEW — Priority 1)
> Show me the EVM transaction history for `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`.

Expected: Returns a paginated list of transactions with hash, from, to, value, method, timestamp. Should show `next_page_params` for pagination.

### 2.2 EVM Transaction History — Pagination (NEW)
> Get the next page of EVM transactions for the same address. Use the `next_page_params` from the previous result.

Expected: Returns the next batch of transactions. Different hashes than page 1.

### 2.3 Token Enumeration (NEW — Priority 2)
> What tokens does the wallet `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` hold?

Expected: Returns at least 2 tokens: wMANTRA and USDC, with balances.

### 2.4 Token Holders (NEW — Priority 3)
> Who holds the wMANTRA token (`0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`)? Show me the holder list.

Expected: Returns holder addresses with balances. Should show ~42 holders.

### 2.5 Token Transfers (NEW)
> Show me the token transfer history for wallet `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`.

Expected: Returns ERC-20/721/1155 transfer events with from, to, token symbol, amount, timestamp. Should return 50 transfers.

### 2.6 Symbol Lookup — Known Token (NEW)
> Look up the contract address for USDC on MANTRA Chain.

Expected: Returns `0x5E76be0F4e09057D75140216F70fd4cE3365bb29` with name "USD Coin" and decimals 6.

### 2.7 Symbol Lookup — All Tokens (NEW)
> What canonical tokens are available on MANTRA Chain? Look up wMANTRA, stMANTRA, mantraUSD, and HYPE.

Expected: Returns contract addresses for all four. Should match the addresses in the MANTRA docs.

### 2.8 Symbol Lookup — Unknown Token (NEW)
> Look up the contract address for DOGE on MANTRA Chain.

Expected: Returns an error saying DOGE is not in the registry, and lists the available tokens.

### 2.9 Address Info — Contract (NEW)
> Get the full profile for the wMANTRA contract `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`.

Expected: Returns is_contract: true, is_verified status, token metadata (name, symbol, holders count), creator address, balance.

### 2.10 Address Info — EOA (NEW)
> Get the full profile for the wallet `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`.

Expected: Returns is_contract: false, coin balance, has_tokens: true, has_token_transfers: true.

### 2.11 Chain Stats (NEW)
> Show me the overall MANTRA Chain EVM statistics.

Expected: Returns total transactions (~216k), total addresses (~3.5k), gas prices, MANTRA price, average block time, network utilization.

---

## Summary

| Section | Tests | What it validates |
|---------|-------|-------------------|
| Part 1 | 17 tests | v2 tools still work (regression) |
| Part 2 | 11 tests | New v3 Blockscout tools + token registry |
| **Total** | **28 tests** | Full v0.3 validation |

After running all tests, report which passed and which failed with any error messages.
