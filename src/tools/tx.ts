import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address, Hash } from 'viem';
import * as services from '../evm-services/index.js';
import { networks } from '../config.js';

export function registerTxTools(server: McpServer) {
  // Get transaction by hash
  server.tool(
    'get_transaction',
    'Get detailed information about a specific EVM transaction by its hash',
    {
      txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ txHash, networkName }) => {
      try {
        const tx = await services.getTransaction(txHash as Hash, networkName);
        return {
          content: [{
            type: 'text',
            text: services.helpers.formatJson(tx)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching transaction ${txHash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get transaction receipt
  server.tool(
    'get_transaction_receipt',
    'Get an EVM transaction receipt by its hash',
    {
      txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ txHash, networkName }) => {
      try {
        const receipt = await services.getTransactionReceipt(txHash as Hash, networkName);
        return {
          content: [{
            type: 'text',
            text: services.helpers.formatJson(receipt)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching transaction receipt ${txHash}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Estimate gas
  server.tool(
    'estimate_gas',
    'Estimate the gas cost for a transaction on MANTRA Chain EVM',
    {
      to: z.string().describe('The recipient address (e.g., "0x1234...")'),
      value: z.string().optional().describe("The amount of MANTRA to send (e.g., '0.1')"),
      data: z.string().optional().describe('The transaction data as a hex string'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ to, value, data, networkName }) => {
      try {
        const params: { to: Address; value?: bigint; data?: `0x${string}` } = { to: to as Address };

        if (value) {
          params.value = services.helpers.parseEther(value);
        }

        if (data) {
          params.data = data as `0x${string}`;
        }

        const gas = await services.estimateGas(params, networkName);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              network: networkName,
              estimatedGas: gas.toString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error estimating gas: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}
