import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantraClient } from '../mantra-client.js';
import { networks } from '../config.js';
import { convertBigIntToString } from '../utils.js';

export function registerStakingTools(server: McpServer, mantraClient: MantraClient) {
  // Get validators
  server.tool(
    "get-validators",
    "Get all active validators on MANTRA Chain",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ networkName }) => {
      await mantraClient.initialize(networkName);
      const validators = await mantraClient.getValidators();
      return {
        content: [{type: "text", text: JSON.stringify(convertBigIntToString(validators))}],
      };
    }
  );

  // Get delegations
  server.tool(
    "get-delegations",
    "Get current staking delegations for an address on MANTRA Chain",
    {
      address: z.string().describe("The bech32 address to query delegations for (e.g., 'mantra1...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ address, networkName }) => {
      await mantraClient.initialize(networkName);
      const delegations = await mantraClient.getDelegations(address);
      return {
        content: [{type: "text", text: JSON.stringify(convertBigIntToString(delegations))}],
      };
    }
  );

  // Get available rewards
  server.tool(
    "get-available-rewards",
    "Get all available staking rewards for an address on MANTRA Chain",
    {
      address: z.string().describe("The bech32 address to query rewards for (e.g., 'mantra1...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ address, networkName }) => {
      await mantraClient.initialize(networkName);
      const rewards = await mantraClient.getAvailableRewards(address);
      return {
        content: [{type: "text", text: JSON.stringify(convertBigIntToString(rewards))}],
      };
    }
  );
}
