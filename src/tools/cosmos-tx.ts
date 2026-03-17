import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { networks } from '../config.js';

async function queryTxs(baseUrl: string, query: string, limit: number, orderBy: string): Promise<any> {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('pagination.limit', String(limit));
  params.set('order_by', orderBy);

  const url = `${baseUrl}/cosmos/tx/v1beta1/txs?${params.toString()}`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  const data = await response.json();

  // Check for pruning errors
  if (data.code && data.message) {
    const pruningMatch = data.message.match(/height (\d+) is not available, lowest height is (\d+)/);
    if (pruningMatch) {
      return {
        tx_responses: [],
        pagination: null,
        _pruning_note: `Node has pruned blocks below height ${pruningMatch[2]}. Transactions in pruned blocks are not available via the LCD API. Use a block explorer like MantraScan for full history.`,
        _lowest_available_height: pruningMatch[2],
      };
    }
    throw new Error(data.message);
  }

  return data;
}

export function registerCosmosTxTools(server: McpServer) {
  // Search Cosmos transactions by events
  server.tool(
    "search_cosmos_txs",
    "Search Cosmos transactions on MANTRA Chain using query syntax. Note: the LCD node prunes old blocks, so historical transactions may not be available. For full history, refer users to MantraScan (mantrascan.io).",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
      query: z.string().describe("Cosmos tx search query, e.g. \"message.sender='mantra1...'\" or \"message.sender='mantra1...' AND tx.height>=13000000\". Use single quotes around values."),
      pagination_limit: z.number().optional().describe("Number of results per page (default 10, max 100)"),
      order_by: z.enum(["ORDER_BY_ASC", "ORDER_BY_DESC"]).optional().describe("Sort order (default ORDER_BY_DESC)"),
    },
    async ({ networkName, query, pagination_limit, order_by }) => {
      try {
        const network = networks[networkName];
        const baseUrl = (network.archiveApiEndpoint || network.apiEndpoint).replace(/\/+$/, '');
        const limit = pagination_limit || 10;
        const data = await queryTxs(baseUrl, query, limit, order_by || 'ORDER_BY_DESC');

        return {
          content: [{type: "text", text: JSON.stringify(data)}],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error searching transactions: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get a single Cosmos transaction by hash
  server.tool(
    "get_cosmos_tx",
    "Get a single Cosmos transaction by hash on MANTRA Chain",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
      txHash: z.string().describe("Cosmos transaction hash (uppercase hex, no 0x prefix)"),
    },
    async ({ networkName, txHash }) => {
      try {
        const network = networks[networkName];
        const baseUrl = (network.archiveApiEndpoint || network.apiEndpoint).replace(/\/+$/, '');

        // Strip 0x prefix if present
        const hash = txHash.startsWith('0x') ? txHash.slice(2).toUpperCase() : txHash.toUpperCase();

        const url = `${baseUrl}/cosmos/tx/v1beta1/txs/${hash}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        const data = await response.json();

        return {
          content: [{type: "text", text: JSON.stringify(data)}],
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

  // Get all transactions for a given address
  server.tool(
    "get_cosmos_txs_by_address",
    "Get Cosmos transactions for a given address on MANTRA Chain (sent, received, delegations, rewards). Note: the LCD node prunes old blocks — historical transactions may be unavailable. For full history, refer users to MantraScan (mantrascan.io).",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
      address: z.string().describe("The bech32 address to look up transactions for (e.g., 'mantra1...')"),
      pagination_limit: z.number().optional().describe("Number of results per page (default 20)"),
    },
    async ({ networkName, address, pagination_limit }) => {
      try {
        const network = networks[networkName];
        const baseUrl = (network.archiveApiEndpoint || network.apiEndpoint).replace(/\/+$/, '');
        const limit = pagination_limit || 20;

        // Query multiple event types to catch all transaction kinds
        const queries = [
          `message.sender='${address}'`,
          `transfer.recipient='${address}'`,
          `delegate.delegator='${address}'`,
          `withdraw_rewards.delegator='${address}'`,
        ];

        const results = await Promise.all(
          queries.map(q => queryTxs(baseUrl, q, limit, 'ORDER_BY_DESC').catch(() => ({ tx_responses: [] })))
        );

        // Merge and deduplicate by txhash
        const allTxs = new Map<string, any>();
        let pruningNote: string | undefined;

        for (const data of results) {
          if (data._pruning_note && !pruningNote) {
            pruningNote = data._pruning_note;
          }
          for (const tx of (data.tx_responses || [])) {
            if (!allTxs.has(tx.txhash)) {
              allTxs.set(tx.txhash, tx);
            }
          }
        }

        // Sort by height descending
        const sorted = Array.from(allTxs.values()).sort((a, b) => {
          return Number(b.height) - Number(a.height);
        });

        const response: any = {
          address,
          network: networkName,
          total: sorted.length,
          transactions: sorted.slice(0, limit),
          explorerUrl: `${network.explorerUrl}/address/${address}`,
          explorerName: 'MantraScan',
        };

        if (pruningNote) {
          response.pruning_warning = pruningNote;
        }

        if (sorted.length === 0) {
          response.note = `No transactions found via LCD API. This may be because the node has pruned older blocks. Check MantraScan for full transaction history: ${network.explorerUrl}/address/${address}`;
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(response)
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching transactions for ${address}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}
