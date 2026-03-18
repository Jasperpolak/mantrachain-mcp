# MANTRA Chain MCP v0.2 — Test Script

Run each test below in order. Copy-paste each prompt into a Cowork conversation with the Mantrachain MCP connector enabled.

---

## Test 1: Unbonding delegations (new tool)

**Prompt:**
> Check if address mantra1umz7g63srlhkzm0guw532vsgvqqehu2wyw4x32 has any unbonding delegations on MANTRA Chain.

**Expected:** Either a list of unbonding entries with validator addresses, display amounts in MANTRA, and completion times — or an empty list if this address has no active unbondings. Should NOT error.

**If empty, follow up with:**
> Check unbonding delegations for mantra19quwsr0resdqale8cehm0kxwmhpnxjez9cx0uy

---

## Test 2: Unbonding vs delegations comparison

**Prompt:**
> For address mantra1umz7g63srlhkzm0guw532vsgvqqehu2wyw4x32, show me both active staking delegations AND any unbonding delegations side by side.

**Expected:** Claude should use both `get-delegations` and `get-unbonding-delegations` tools (possibly in parallel) and present a combined view.

---

## Test 3: Historical contract read (blockNumber param)

**Prompt:**
> I want to read the totalSupply of the ERC-20 contract at 0x...CONTRACT_ADDRESS... on MANTRA EVM at block 13000000, and also at the latest block. Show me both values so I can compare.

**Note:** You'll need a known ERC-20 contract address on MANTRA EVM. If you have one from your earlier testing, use that. Otherwise try:
> What ERC-20 contracts do you know about on MANTRA EVM? Use is_contract to check a few known addresses.

**Expected:** Two different `read_evm_contract` calls — one with `blockNumber: 13000000` and one without. Values may differ if supply changed between those blocks.

---

## Test 4: Event logs — recent blocks

**Prompt:**
> Get me all EVM event logs from the last 100 blocks on MANTRA Chain mainnet.

**Expected:** Claude should first get the current block number, then call `get_evm_logs` with `fromBlock` and `toBlock` set to a 100-block range. Returns either log entries or an empty array if no events occurred in that range.

---

## Test 5: Event logs — filtered by contract

**Prompt:**
> Show me event logs from contract 0x...CONTRACT_ADDRESS... between blocks 13300000 and 13400000 on MANTRA EVM.

**Note:** Use any known contract address from your earlier testing.

**Expected:** `get_evm_logs` called with `address`, `fromBlock`, and `toBlock`. Should return filtered logs for that specific contract.

---

## Test 6: Event logs — Transfer events with topic filter

**Prompt:**
> Search for ERC-20 Transfer events on MANTRA EVM in the last 500 blocks. The Transfer event topic hash is 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

**Expected:** `get_evm_logs` called with the Transfer topic in the topics array, and a 500-block range. Should return any ERC-20 transfers in that range.

---

## Test 7: Regression — existing tools still work

**Prompt:**
> Give me a full overview of address mantra1umz7g63srlhkzm0guw532vsgvqqehu2wyw4x32: balance, staking delegations, unbonding delegations, and pending rewards.

**Expected:** Claude uses `get-balance`, `get-delegations`, `get-unbonding-delegations`, and `get-available-rewards` — all four should return successfully. This confirms the new tool didn't break existing ones.

---

## Test 8: Regression — read_evm_contract without blockNumber

**Prompt:**
> Check if 0x275b7900A0E42FC51ff741e2E4E85c1BaB018Ba6 is a contract on MANTRA EVM. If it is, try reading its name() function.

**Expected:** `is_contract` and optionally `read_evm_contract` (without blockNumber) should work exactly as before.

---

## Pass criteria

- Tests 1-2: `get-unbonding-delegations` tool is called and returns structured data (or empty array)
- Tests 3: `read_evm_contract` is called with and without `blockNumber` param
- Tests 4-6: `get_evm_logs` tool is called with correct parameters
- Tests 7-8: Existing tools work unchanged
- No errors unless the on-chain data doesn't exist (which is fine — the tool should handle gracefully)
