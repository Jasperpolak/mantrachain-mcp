import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address, Hash } from 'viem';
import * as services from '../evm-services/index.js';
import { networkNameSchema, formatError } from './schemas.js';
import { isPruningError, EVM_ACTIVATION_BLOCK, getArchiveApiEndpoint } from '../evm-archive-fallback.js';
import { networks } from '../config.js';

/**
 * Try to find a transaction via Cosmos LCD as a fallback.
 * Searches by EVM tx hash — Cosmos indexes EVM txs by their hash.
 */
async function tryCosmosLookup(txHash: string, networkName: string): Promise<any | null> {
  try {
    const baseUrl = getArchiveApiEndpoint(networkName);
    // Cosmos indexes EVM tx hashes in uppercase without 0x prefix
    const hash = txHash.startsWith('0x') ? txHash.slice(2).toUpperCase() : txHash.toUpperCase();
    const response = await fetch(`${baseUrl}/cosmos/tx/v1beta1/txs/${hash}`, {
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json();
    if (data.tx_response) return data;
    return null;
  } catch {
    return null;
  }
}

export function registerTxTools(server: McpServer) {
  // Get transaction by hash
  server.tool(
    'get_transaction',
    'Get detailed information about a specific EVM transaction by its hash. Automatically falls back to archive node for old blocks and to Cosmos for pre-EVM transactions.',
    {
      txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      networkName: networkNameSchema,
    },
    async ({ txHash, networkName }) => {
      try {
        const tx = await services.getTransaction(txHash as Hash, networkName);
        return {
          content: [{type: 'text', text: services.helpers.formatJson(tx)}]
        };
      } catch (error) {
        // If EVM lookup fails (even with archive), try Cosmos
        if (isPruningError(error)) {
          const cosmosTx = await tryCosmosLookup(txHash, networkName);
          if (cosmosTx) {
            return {
              content: [{type: 'text', text: JSON.stringify({
                _note: `Transaction not found via EVM RPC. Found via Cosmos LCD instead — this may be a pre-EVM transaction (before block ${EVM_ACTIVATION_BLOCK.toLocaleString()}).`,
                source: 'cosmos_lcd',
                ...cosmosTx,
              }, null, 2)}]
            };
          }
        }
        return {
          content: [{type: 'text', text: `Error fetching transaction ${txHash}: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get transaction receipt
  server.tool(
    'get_transaction_receipt',
    'Get an EVM transaction receipt by its hash. Automatically falls back to archive node for old blocks and to Cosmos for pre-EVM transactions.',
    {
      txHash: z.string().describe("The transaction hash to look up (e.g., '0x1234...')"),
      networkName: networkNameSchema,
    },
    async ({ txHash, networkName }) => {
      try {
        const receipt = await services.getTransactionReceipt(txHash as Hash, networkName);
        return {
          content: [{type: 'text', text: services.helpers.formatJson(receipt)}]
        };
      } catch (error) {
        // If EVM lookup fails (even with archive), try Cosmos
        if (isPruningError(error)) {
          const cosmosTx = await tryCosmosLookup(txHash, networkName);
          if (cosmosTx) {
            return {
              content: [{type: 'text', text: JSON.stringify({
                _note: `EVM receipt not available for this transaction. Found via Cosmos LCD instead — this may be a pre-EVM transaction (before block ${EVM_ACTIVATION_BLOCK.toLocaleString()}).`,
                source: 'cosmos_lcd',
                ...cosmosTx,
              }, null, 2)}]
            };
          }
        }
        return {
          content: [{type: 'text', text: `Error fetching transaction receipt ${txHash}: ${formatError(error)}`}],
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
      networkName: networkNameSchema,
    },
    async ({ to, value, data, networkName }) => {
      try {
        const params: { to: Address; value?: bigint; data?: `0x${string}` } = { to: to as Address };

        if (value) params.value = services.helpers.parseEther(value);
        if (data) params.data = data as `0x${string}`;

        const gas = await services.estimateGas(params, networkName);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ network: networkName, estimatedGas: gas.toString() }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error estimating gas: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
