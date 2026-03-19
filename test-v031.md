# MANTRA Chain MCP v0.3.1 — Test Script

Use this in a clean Cowork window connected to the MANTRA Chain MCP. Disconnect and reconnect the connector first to pick up the new tools, then start a fresh conversation. Run each test and note whether it passes or fails.

---

## v0.3.1 Changes Tested

1. `average_block_time` renamed to `average_block_time_ms` in chain stats
2. `method_id` (4-byte hex selector) added to EVM transaction output
3. `limit` parameter added to `get_address_token_list`

---

## Test 1: Block time unit documentation

> Get the chain stats for MANTRA Chain.

**Expected:** Response contains the field `average_block_time_ms` (NOT `average_block_time`). Value should be in the range ~3000–4000 (milliseconds, i.e. ~3–4 second block time).

**Pass criteria:** Field name is `average_block_time_ms`. No field called `average_block_time` exists.

---

## Test 2: 4-byte selector on EVM transactions

> Show me the EVM transaction history for `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Every transaction in the response has a `method_id` field containing a 10-character hex string (e.g. `0x93674396`).

**Pass criteria:**
- Transactions WITH `decoded_input` should have BOTH `method_id` (hex) AND `decoded_input.method_call` (human-readable).
- Transactions WITHOUT `decoded_input` (null) should still have `method_id` with the hex selector.
- `method_id` should match the first 4 bytes of the transaction's calldata.

---

## Test 3: 4-byte selector on contract creation / simple transfer

> Show me the EVM transaction history for `0xE3047710EF6cB36Bcf1E58145529778eA7Cb5598` on mantra-1.

**Expected:** Transactions that are simple ETH transfers (no calldata) should have `method_id: null`. Contract calls should have a valid `method_id`.

**Pass criteria:** `method_id` is null when there is no input data, and populated when there is.

---

## Test 4: Token list with limit

> List all tokens held by `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1, but limit to 1 result.

**Expected:** Response contains exactly 1 token. `token_count` should be `1`.

**Pass criteria:** Only 1 token returned despite the wallet holding more.

---

## Test 5: Token list without limit (regression)

> List all tokens held by `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns all tokens the wallet holds (same as v0.3 behavior). `token_count` matches the actual number of tokens.

**Pass criteria:** No truncation when `limit` is not provided. Result identical to v0.3.

---

## Test 6: v0.3 regression — EVM tx history still works

> Show me the EVM transaction history for `0x6827E52Eb8F25f9942c045C422909D29C2958b4E` on mantra-1.

**Expected:** Returns 50 transactions with all existing fields (hash, block_number, timestamp, from, to, value, method, status, fee, gas_used, gas_price, decoded_input, token_transfers) plus the new `method_id` field. Pagination cursor present.

**Pass criteria:** All v0.3 fields still present. New `method_id` field added. No missing or broken fields.

---

## Test 7: v0.3 regression — chain stats still works

> Get the chain stats for MANTRA Chain.

**Expected:** All fields present: `total_transactions`, `total_addresses`, `total_blocks`, `average_block_time_ms`, `network_utilization_percentage`, `coin_price`, `market_cap`, `transactions_today`, `gas_prices` (slow/average/fast), `gas_used_today`.

**Pass criteria:** All fields populated. No nulls on core fields.

---

*Test script for MANTRA Chain MCP v0.3.1 — March 2026*
