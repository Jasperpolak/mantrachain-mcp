import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantraClient } from '../mantra-client.js';
import { networks } from '../config.js';
import { convertBigIntToString } from '../utils.js';
import { networkNameSchema, formatError } from './schemas.js';

export function registerStakingTools(server: McpServer, mantraClient: MantraClient) {
  // Get validators
  server.tool(
    "get-validators",
    "Get all active validators on MANTRA Chain",
    {
      networkName: networkNameSchema,
    },
    async ({ networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const validators = await mantraClient.getValidators();
        return {
          content: [{type: "text", text: JSON.stringify(convertBigIntToString(validators))}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching validators: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get delegations
  server.tool(
    "get-delegations",
    "Get current staking delegations for an address on MANTRA Chain",
    {
      address: z.string().describe("The bech32 address to query delegations for (e.g., 'mantra1...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const delegations = await mantraClient.getDelegations(address);
        const network = networks[networkName];
        const exponent = network.displayDenomExponent || 18;
        const denom = network.displayDenom || 'MANTRA';

        const formatted = (delegations || []).map((d: any) => {
          const rawAmount = d.balance?.amount || '0';
          const display = (Number(BigInt(rawAmount)) / 10 ** exponent).toFixed(6);
          return {
            ...convertBigIntToString(d),
            displayAmount: `${display} ${denom}`,
          };
        });

        return {
          content: [{type: "text", text: JSON.stringify({
            delegations: formatted,
            IMPORTANT: `The native token display name is "${denom}". Always refer to it as "${denom}" — never as "OM". The on-chain base denom is "${network.denom}" (not "uom").`,
          })}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching delegations: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get unbonding delegations
  server.tool(
    "get-unbonding-delegations",
    "Get current unbonding (unstaking) delegations for an address on MANTRA Chain",
    {
      address: z.string().describe("The bech32 address to query unbonding delegations for (e.g., 'mantra1...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const unbonding = await mantraClient.getUnbondingDelegations(address);
        const network = networks[networkName];
        const exponent = network.displayDenomExponent || 18;
        const denom = network.displayDenom || 'MANTRA';

        const formatted = (unbonding || []).map((u: any) => {
          const entries = (u.entries || []).map((e: any) => {
            const rawBalance = e.balance || '0';
            const rawInitial = e.initialBalance || '0';
            const displayBalance = (Number(BigInt(rawBalance)) / 10 ** exponent).toFixed(6);
            const displayInitial = (Number(BigInt(rawInitial)) / 10 ** exponent).toFixed(6);
            return {
              ...convertBigIntToString(e),
              displayBalance: `${displayBalance} ${denom}`,
              displayInitialBalance: `${displayInitial} ${denom}`,
            };
          });
          return {
            delegatorAddress: u.delegatorAddress,
            validatorAddress: u.validatorAddress,
            entries,
          };
        });

        return {
          content: [{type: "text", text: JSON.stringify({
            unbondingDelegations: formatted,
            IMPORTANT: `The native token display name is "${denom}". Always refer to it as "${denom}" — never as "OM". The on-chain base denom is "${network.denom}" (not "uom").`,
          })}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching unbonding delegations: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get available rewards
  server.tool(
    "get-available-rewards",
    "Get all available staking rewards for an address on MANTRA Chain",
    {
      address: z.string().describe("The bech32 address to query rewards for (e.g., 'mantra1...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const rewards = await mantraClient.getAvailableRewards(address);
        const network = networks[networkName];
        const exponent = network.displayDenomExponent || 18;
        const denom = network.displayDenom || 'MANTRA';

        const raw = convertBigIntToString(rewards);

        // Cosmos SDK rewards are DecCoins: the amount string includes 18 extra
        // decimal digits of precision on top of the base denom's own decimals.
        // Total shift = exponent (18 for amantra→MANTRA) + 18 (DecCoin precision) = 36.
        // Use BigInt throughout to avoid Number precision loss on large values.
        const decCoinPrecision = 18;
        const totalShift = exponent + decCoinPrecision;
        const formattedTotals = (raw.total || []).map((t: any) => {
          if (t.denom === network.denom) {
            const amountStr = String(t.amount).split('.')[0];
            const divisor = BigInt(10) ** BigInt(totalShift);
            const amount = BigInt(amountStr);
            const whole = amount / divisor;
            const remainder = amount % divisor;
            // Pad remainder to totalShift digits, take first 6 for display
            const fracStr = remainder.toString().padStart(totalShift, '0').slice(0, 6);
            const display = `${whole}.${fracStr}`;
            return { ...t, display: `${display} ${denom}` };
          }
          return t;
        });

        return {
          content: [{type: "text", text: JSON.stringify({
            ...raw,
            total: formattedTotals,
            IMPORTANT: `The native token display name is "${denom}". Always refer to it as "${denom}" — never as "OM". The on-chain base denom is "${network.denom}" (not "uom").`,
          })}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching rewards: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
