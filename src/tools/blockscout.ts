import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MantraClient } from '../mantra-client.js';
import { networks } from '../config.js';
import { networkNameSchema, formatError } from './schemas.js';
import { getTokenBySymbol, getAllTokens } from '../token-registry.js';
import { convertBigIntToString } from '../utils.js';

export function registerBlockscoutTools(server: McpServer, mantraClient: MantraClient) {

  // 1. EVM transaction history by address (Priority 1)
  server.tool(
    "get_evm_txs_by_address",
    "Get EVM transaction history for an address on MANTRA Chain. Returns transactions with decoded input, token transfers, and gas details. Paginated (50 per page).",
    {
      address: z.string().describe("The EVM address (0x...) to get transaction history for"),
      networkName: networkNameSchema,
      page_params: z.record(z.string()).optional().describe("Pagination parameters from a previous response's next_page_params field"),
    },
    async ({ address, networkName, page_params }) => {
      try {
        await mantraClient.initialize(networkName);
        const result = await mantraClient.getAddressTransactions(address, page_params);

        const items = (result.items || []).map((tx: any) => ({
          hash: tx.hash,
          block_number: tx.block_number,
          timestamp: tx.timestamp,
          from: tx.from?.hash,
          to: tx.to?.hash,
          value: tx.value,
          method: tx.method,
          status: tx.status,
          fee: tx.fee?.value,
          gas_used: tx.gas_used,
          gas_price: tx.gas_price,
          method_id: tx.raw_input?.length >= 10 ? tx.raw_input.slice(0, 10) : null,
          decoded_input: tx.decoded_input ? {
            method_call: tx.decoded_input.method_call,
            method_id: tx.decoded_input.method_id,
          } : null,
          token_transfers: tx.token_transfers?.map((t: any) => ({
            from: t.from?.hash,
            to: t.to?.hash,
            token_symbol: t.token?.symbol,
            token_address: t.token?.address,
            total: t.total?.value,
          })),
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network: networkName,
              transaction_count: items.length,
              transactions: items,
              next_page_params: result.next_page_params || null,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching EVM transactions: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );

  // 2. Token enumeration per wallet (Priority 2)
  server.tool(
    "get_address_token_list",
    "List all ERC-20, ERC-721, and ERC-1155 tokens held by an address. Answers 'what tokens does this wallet hold?' without needing a pre-known contract list.",
    {
      address: z.string().describe("The EVM address (0x...) to enumerate tokens for"),
      networkName: networkNameSchema,
      page_params: z.record(z.string()).optional().describe("Pagination parameters from a previous response's next_page_params field"),
      limit: z.number().optional().describe("Optional: maximum number of tokens to return. Defaults to all."),
    },
    async ({ address, networkName, page_params, limit }) => {
      try {
        await mantraClient.initialize(networkName);
        const result = await mantraClient.getAddressTokens(address, page_params);

        const items = (result.items || []).map((entry: any) => ({
          token: {
            name: entry.token?.name,
            symbol: entry.token?.symbol,
            address: entry.token?.address,
            type: entry.token?.type,
            decimals: entry.token?.decimals,
            holders_count: entry.token?.holders_count,
          },
          value: entry.value,
          token_id: entry.token_id,
          token_instance: entry.token_instance,
        }));

        const limitedItems = limit ? items.slice(0, limit) : items;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network: networkName,
              token_count: limitedItems.length,
              total_available: items.length,
              tokens: limitedItems,
              next_page_params: result.next_page_params || null,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching address tokens: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );

  // 3. Token holder list (Priority 3)
  server.tool(
    "get_token_holders",
    "List all holders of a given ERC-20 token with their balances. Useful for token distribution analysis.",
    {
      tokenAddress: z.string().describe("The contract address of the ERC-20 token"),
      networkName: networkNameSchema,
      page_params: z.record(z.string()).optional().describe("Pagination parameters from a previous response's next_page_params field"),
    },
    async ({ tokenAddress, networkName, page_params }) => {
      try {
        await mantraClient.initialize(networkName);
        const result = await mantraClient.getTokenHolders(tokenAddress, page_params);

        const items = (result.items || []).map((holder: any) => ({
          address: holder.address?.hash,
          is_contract: holder.address?.is_contract,
          value: holder.value,
          token_id: holder.token_id,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              token_address: tokenAddress,
              network: networkName,
              holder_count: items.length,
              holders: items,
              next_page_params: result.next_page_params || null,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching token holders: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );

  // 4. Token transfer history
  server.tool(
    "get_address_token_transfers",
    "Get ERC-20, ERC-721, and ERC-1155 token transfer history for an address. Optionally filter by token contract or token type.",
    {
      address: z.string().describe("The EVM address (0x...) to get token transfers for"),
      networkName: networkNameSchema,
      token: z.string().optional().describe("Optional: filter to a specific token contract address"),
      type: z.enum(["ERC-20", "ERC-721", "ERC-1155"]).optional().describe("Optional: filter by token type"),
      page_params: z.record(z.string()).optional().describe("Pagination parameters from a previous response's next_page_params field"),
    },
    async ({ address, networkName, token, type, page_params }) => {
      try {
        await mantraClient.initialize(networkName);
        const result = await mantraClient.getAddressTokenTransfers(address, { token, type }, page_params);

        const items = (result.items || []).map((transfer: any) => ({
          tx_hash: transfer.tx_hash,
          timestamp: transfer.timestamp,
          from: transfer.from?.hash,
          to: transfer.to?.hash,
          token: {
            name: transfer.token?.name,
            symbol: transfer.token?.symbol,
            address: transfer.token?.address,
            type: transfer.token?.type,
          },
          total: transfer.total?.value,
          token_id: transfer.token_id,
          method: transfer.method,
          block_number: transfer.block_number,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              address,
              network: networkName,
              transfer_count: items.length,
              transfers: items,
              next_page_params: result.next_page_params || null,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching token transfers: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );

  // 5. Symbol-to-address resolution (MCP-only, no Blockscout)
  server.tool(
    "get_token_info_by_symbol",
    "Look up a canonical MANTRA Chain token by its symbol (e.g. 'USDC', 'wMANTRA', 'mantraUSD'). Returns the contract address, name, and decimals. Only covers canonical tokens — use get_erc20_token_info for arbitrary tokens.",
    {
      symbol: z.string().describe("Token symbol to look up (e.g. 'USDC', 'wMANTRA', 'mantraUSD', 'HYPE')"),
      networkName: networkNameSchema,
    },
    async ({ symbol, networkName }) => {
      const token = getTokenBySymbol(symbol, networkName);
      if (!token) {
        const available = getAllTokens(networkName).map(t => t.symbol);
        return {
          content: [{
            type: "text",
            text: `Token '${symbol}' not found in the registry for ${networkName}. Available tokens: ${available.join(', ')}. For tokens not in the registry, use get_erc20_token_info with the contract address.`
          }],
          isError: true
        };
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ network: networkName, ...token }, null, 2)
        }],
      };
    }
  );

  // 6. Address info / portfolio overview
  server.tool(
    "get_address_info",
    "Get a comprehensive profile of an EVM address: balance, transaction count, contract status, verification, token info, creator, and tags. Works for both EOAs and contracts.",
    {
      address: z.string().describe("The EVM address (0x...) to get info for"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const info = await mantraClient.getAddressInfo(address);

        const result: any = {
          address: info.hash,
          network: networkName,
          is_contract: info.is_contract,
          is_verified: info.is_verified,
          coin_balance: info.coin_balance,
          exchange_rate: info.exchange_rate,
          block_number_balance_updated_at: info.block_number_balance_updated_at,
          has_tokens: info.has_tokens,
          has_token_transfers: info.has_token_transfers,
          has_logs: info.has_logs,
        };

        if (info.is_contract) {
          result.contract_name = info.name;
          result.creator_address = info.creator_address_hash;
          result.creation_tx = info.creation_transaction_hash;
        }

        if (info.token) {
          result.token = {
            name: info.token.name,
            symbol: info.token.symbol,
            type: info.token.type,
            decimals: info.token.decimals,
            total_supply: info.token.total_supply,
            holders_count: info.token.holders_count,
            circulating_market_cap: info.token.circulating_market_cap,
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching address info: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );

  // 7. Chain stats overview
  server.tool(
    "get_chain_stats",
    "Get MANTRA Chain EVM statistics: total transactions, total addresses, gas prices, MANTRA price, average block time (in milliseconds), and network utilization.",
    {
      networkName: networkNameSchema,
    },
    async ({ networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const stats = await mantraClient.getChainStats();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network: networkName,
              total_transactions: stats.total_transactions,
              total_addresses: stats.total_addresses,
              total_blocks: stats.total_blocks,
              average_block_time_ms: stats.average_block_time,
              network_utilization_percentage: stats.network_utilization_percentage,
              coin_price: stats.coin_price,
              market_cap: stats.market_cap,
              transactions_today: stats.transactions_today,
              gas_prices: {
                slow: stats.gas_prices?.slow,
                average: stats.gas_prices?.average,
                fast: stats.gas_prices?.fast,
              },
              gas_used_today: stats.gas_used_today,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error fetching chain stats: ${formatError(error)}` }],
          isError: true
        };
      }
    }
  );
}
