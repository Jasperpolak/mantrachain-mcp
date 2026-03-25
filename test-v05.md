# v0.5 Test Script — MANTRA Chain MCP
**Date:** 2026-03-25
**Scope:** 3 new features + regression tests for existing tools

## Test Addresses
- **EVM EOA:** `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`
- **Cosmos:** `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`
- **Fluxtra vault:** `0xbF53F231eac37b1Fe3b8aAF2e4963f89fB7790d0`
- **wMANTRA token:** `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`
- **OMIES EOA (not a contract):** `0x8d356C4839dB0e3e661039ec7a0dAf51421E91CB`
- **Algebra Position Manager:** `0x69D57B9D990ee65f1BCbe3Be8DBf90431025dF3d`

---

## NEW FEATURE TESTS (10 tests)

### Test 1 — get_nft_info: EOA pre-check
Call `get_nft_info` with tokenAddress `0x8d356C4839dB0e3e661039ec7a0dAf51421E91CB`, tokenId `1`, network `mantra-1`.
**Expected:** Error with `"error": "not_a_contract"` and clear message. Should NOT say "non-standard interface".

### Test 2 — get_nft_info: valid contract still works
Call `get_nft_info` with tokenAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, tokenId `1`, network `mantra-1`.
**Expected:** Either returns token data OR a meaningful Blockscout fallback — NOT a "not a contract" error (this address IS a contract).

### Test 3 — get_vault_underlying: basic vault read
Call `get_vault_underlying` with vaultAddress `0xbF53F231eac37b1Fe3b8aAF2e4963f89fB7790d0`, network `mantra-1`.
**Expected:** Returns `token0` and `token1` objects with address, name, symbol, decimals. Returns `totalUnderlying` with non-zero amounts. Returns `totalShares`. No `user` field (ownerAddress not provided).

### Test 4 — get_vault_underlying: with owner
Call `get_vault_underlying` with vaultAddress `0xbF53F231eac37b1Fe3b8aAF2e4963f89fB7790d0`, ownerAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Same as Test 3, plus a `user` object with `shares` and `underlying` values.

### Test 5 — get_vault_underlying: invalid address
Call `get_vault_underlying` with vaultAddress `0xinvalid`, network `mantra-1`.
**Expected:** Error mentioning invalid vault address.

### Test 6 — get_vault_underlying: EOA (not a vault)
Call `get_vault_underlying` with vaultAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Error — the contract calls should fail since this is an EOA, not a vault.

### Test 7 — get_lp_positions: address with no positions
Call `get_lp_positions` with ownerAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns `positionCount: 0` and empty `positions` array with a helpful message.

### Test 8 — get_lp_positions: known LP holder
Call `get_lp_positions` with ownerAddress `0xC7590B85e1C736C26c7D68e1CE78028e60a85E7E`, network `mantra-1`.
**Expected:** Returns `positionCount` > 0. Each position has `tokenId`, `token0`, `token1` (with symbol and decimals), `tickLower`, `tickUpper`, `liquidity`, `tokensOwed0`, `tokensOwed1`.

### Test 9 — get_lp_positions: invalid address
Call `get_lp_positions` with ownerAddress `notanaddress`, network `mantra-1`.
**Expected:** Error mentioning invalid address.

### Test 10 — get_lp_positions: testnet (no position manager)
Call `get_lp_positions` with ownerAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-dukong-1`.
**Expected:** Error mentioning position manager not configured for this network.

---

## REGRESSION TESTS (15 tests)

### Test 11 — get_evm_balance
Call `get_evm_balance` with address `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns balance as a number string.

### Test 12 — get-balance (Cosmos)
Call `get-balance` with address `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`, network `mantra-1`.
**Expected:** Returns balances array with amantra denomination.

### Test 13 — get_erc20_token_info
Call `get_erc20_token_info` with tokenAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, network `mantra-1`.
**Expected:** Returns name (Wrapped MANTRA), symbol (wMANTRA), decimals (18), totalSupply.

### Test 14 — get_token_balance
Call `get_token_balance` with tokenAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, ownerAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns balance (may be 0).

### Test 15 — get_address_token_list
Call `get_address_token_list` with address `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns array of token holdings.

### Test 16 — get_address_token_list with type filter
Call `get_address_token_list` with address `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, type `ERC-20`, network `mantra-1`.
**Expected:** Returns only ERC-20 tokens, no NFTs.

### Test 17 — get_token_holders
Call `get_token_holders` with tokenAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, network `mantra-1`.
**Expected:** Returns holders array with address, balance. Non-empty list.

### Test 18 — get-delegations
Call `get-delegations` with address `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`, network `mantra-1`.
**Expected:** Returns delegations array (may be empty for this address).

### Test 19 — get-unbonding-delegations
Call `get-unbonding-delegations` with address `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`, network `mantra-1`.
**Expected:** Returns unbondingDelegations array (may be empty).

### Test 20 — read_evm_contract (historical with archive fallback)
Call `read_evm_contract` with contractAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, abi `[{"inputs":[],"name":"totalSupply","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}]`, functionName `totalSupply`, blockNumber `10000000`, network `mantra-1`.
**Expected:** Returns a bigint value (archive fallback should handle the pruned block).

### Test 21 — get_transaction (archive fallback)
Call `get_transaction` with txHash `0x6e21abc41ef05a0addb9f8e4479b27e4e74b0e1a9e04a1b2eb0cd88a96e3e4dd`, network `mantra-1`.
**Expected:** Returns transaction details or pre-EVM redirect message. Should NOT error with "header not found".

### Test 22 — get_evm_internal_txs_by_address
Call `get_evm_internal_txs_by_address` with address `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns internal transactions array (may be empty for this address).

### Test 23 — check_nft_ownership
Call `check_nft_ownership` with tokenAddress `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, tokenId `1`, ownerAddress `0x6827E52Eb8F25f9942c045C422909D29C2958b4E`, network `mantra-1`.
**Expected:** Returns isOwner boolean (likely false). No crash.

### Test 24 — get_cosmos_txs_by_address
Call `get_cosmos_txs_by_address` with address `mantra1qnz0e4uq8zjqxa6fxdnkjyerdd98erslrp7wkk`, network `mantra-1`, pagination_limit `3`.
**Expected:** Returns transactions array with tx hashes, heights, and timestamps.

### Test 25 — is_contract
Call `is_contract` with address `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598`, network `mantra-1`.
**Expected:** Returns true (this is the wMANTRA contract).

---

## Scoring
- **25/25** = Ship it, tell Octavio to re-test
- **22-24** = Minor issues, patch before release
- **< 22** = Investigate failures before shipping
