import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantraClient } from '../mantra-client.js';
import { convertBigIntToString } from '../utils.js';
import { networkNameSchema } from './schemas.js';

const DEX_UOM_NOTE = "On-chain DEX pool data uses 'uom' as the denom string for MANTRA's native token. 'uom' = 'amantra' = MANTRA native token. They are the same asset.";

export function registerDexTools(server: McpServer, mantraClient: MantraClient) {
  // Get all DEX pools
  server.tool(
    "dex-get-pools",
    "Get all available liquidity pools from the MANTRA DEX",
    {
      networkName: networkNameSchema,
    },
    async ({ networkName }) => {
      await mantraClient.initialize(networkName);
      const pools = await mantraClient.getPools();
      return {
        content: [{type: "text", text: JSON.stringify({ note: DEX_UOM_NOTE, pools })}],
      };
    }
  );

  // Find possible swap routes
  server.tool(
    "dex-find-routes",
    "Find available swap routes between two tokens on the MANTRA DEX - check available tokens via `dex-get-pools` first",
    {
      networkName: networkNameSchema.describe("Name of the network to use"),
      tokenInDenom: z.string().describe("Denomination of the token to swap from"),
      tokenOutDenom: z.string().describe("Denomination of the token to swap to"),
    },
    async ({ networkName, tokenInDenom, tokenOutDenom }) => {
      await mantraClient.initialize(networkName);
      const routes = await mantraClient.findSwapRoutes(tokenInDenom, tokenOutDenom);
      return {
        content: [{type: "text", text: JSON.stringify({ note: DEX_UOM_NOTE, routes })}],
      };
    }
  );

  // Simulate a swap
  server.tool(
    "dex-simulate-swap",
    "Simulate a token swap on the MANTRA DEX to get expected outcome without executing - check available tokens via `dex-get-pools` first",
    {
      networkName: networkNameSchema.describe("Name of the network to use"),
      tokenInDenom: z.string().describe("Denomination of the token to swap from"),
      tokenInAmount: z.string().describe("Amount of tokens to swap"),
      tokenOutDenom: z.string().describe("Denomination of the token to swap to"),
    },
    async ({ networkName, tokenInDenom, tokenInAmount, tokenOutDenom }) => {
      await mantraClient.initialize(networkName);
      const simulation = await mantraClient.simulateSwap({
        tokenIn: { denom: tokenInDenom, amount: tokenInAmount },
        tokenOutDenom
      });
      return {
        content: [{type: "text", text: JSON.stringify({
          note: DEX_UOM_NOTE,
          simulation: convertBigIntToString(simulation)
        })}],
      };
    }
  );
}
