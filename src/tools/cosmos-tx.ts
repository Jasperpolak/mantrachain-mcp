import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { networks } from '../config.js';

export function registerCosmosTxTools(server: McpServer) {
  // Search Cosmos transactions by events
  server.tool(
    "search_cosmos_txs",
    "Search Cosmos transactions on MANTRA Chain by events (sender, recipient, height range, msg type). Returns paginated results.",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
      events: z.array(z.string()).describe("Array of event query strings, e.g. [\"message.sender='mantra1...'\", \"tx.height>=1000\"]"),
      pagination_limit: z.number().optional().describe("Number of results per page (default 10, max 100)"),
      pagination_offset: z.number().optional().describe("Offset for pagination (default 0)"),
      order_by: z.enum(["ORDER_BY_ASC", "ORDER_BY_DESC"]).optional().describe("Sort order (default ORDER_BY_DESC)"),
    },
    async ({ networkName, events, pagination_limit, pagination_offset, order_by }) => {
      try {
        const network = networks[networkName];
        const baseUrl = network.apiEndpoint.replace(/\/+$/, '');

        const params = new URLSearchParams();
        for (const event of events) {
          params.append('events', event);
        }
        if (pagination_limit) params.set('pagination.limit', String(pagination_limit));
        if (pagination_offset) params.set('pagination.offset', String(pagination_offset));
        if (order_by) params.set('order_by', order_by);

        const url = `${baseUrl}/cosmos/tx/v1beta1/txs?${params.toString()}`;
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
        const baseUrl = network.apiEndpoint.replace(/\/+$/, '');

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
    "Get all Cosmos transactions for a given address on MANTRA Chain (both sent and received), paginated",
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
        const baseUrl = network.apiEndpoint.replace(/\/+$/, '');
        const limit = pagination_limit || 20;

        // Search for sent transactions
        const sentParams = new URLSearchParams();
        sentParams.append('events', `message.sender='${address}'`);
        sentParams.set('pagination.limit', String(limit));
        sentParams.set('order_by', 'ORDER_BY_DESC');

        // Search for received transactions
        const recvParams = new URLSearchParams();
        recvParams.append('events', `transfer.recipient='${address}'`);
        recvParams.set('pagination.limit', String(limit));
        recvParams.set('order_by', 'ORDER_BY_DESC');

        const [sentRes, recvRes] = await Promise.all([
          fetch(`${baseUrl}/cosmos/tx/v1beta1/txs?${sentParams.toString()}`, {
            headers: { 'Accept': 'application/json' },
          }),
          fetch(`${baseUrl}/cosmos/tx/v1beta1/txs?${recvParams.toString()}`, {
            headers: { 'Accept': 'application/json' },
          }),
        ]);

        const sentData = await sentRes.json();
        const recvData = await recvRes.json();

        // Merge and deduplicate by txhash
        const allTxs = new Map<string, any>();

        for (const tx of (sentData.tx_responses || [])) {
          allTxs.set(tx.txhash, { ...tx, direction: 'sent' });
        }
        for (const tx of (recvData.tx_responses || [])) {
          if (!allTxs.has(tx.txhash)) {
            allTxs.set(tx.txhash, { ...tx, direction: 'received' });
          } else {
            // Tx appears in both — mark as both
            allTxs.get(tx.txhash).direction = 'sent_and_received';
          }
        }

        // Sort by height descending
        const sorted = Array.from(allTxs.values()).sort((a, b) => {
          return Number(b.height) - Number(a.height);
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network: networkName,
              total: sorted.length,
              sent_total: sentData.pagination?.total || '0',
              received_total: recvData.pagination?.total || '0',
              transactions: sorted.slice(0, limit),
            })
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
