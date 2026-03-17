import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { networks } from '../config.js';

export function registerSupplyTools(server: McpServer) {
  // Get token total supply
  server.tool(
    "get_token_supply",
    "Get the total supply of the MANTRA token on-chain",
    {
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use - check available networks via `networks://all`. Defaults to `mantra-1` mainnet."),
    },
    async ({ networkName }) => {
      try {
        const network = networks[networkName];
        const baseUrl = network.apiEndpoint.replace(/\/+$/, '');
        const denom = network.denom;
        const displayDenom = network.displayDenom || 'MANTRA';
        const exponent = network.displayDenomExponent || 18;

        const url = `${baseUrl}/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        const data = await response.json();
        const rawAmount = data.amount?.amount || '0';

        // Convert to human-readable
        const humanReadable = (Number(BigInt(rawAmount)) / Math.pow(10, exponent)).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              network: networkName,
              denom,
              displayDenom,
              rawAmount,
              humanReadable: `${humanReadable} ${displayDenom}`,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching token supply: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get token price from CoinGecko
  server.tool(
    "get_token_price",
    "Get the current price of the MANTRA (OM) token from CoinGecko",
    {
      vs_currencies: z.string().optional().describe("Comma-separated list of currencies to get price in (default: 'usd'). Examples: 'usd', 'usd,btc,eth'"),
    },
    async ({ vs_currencies }) => {
      try {
        const currencies = vs_currencies || 'usd';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=mantra-dao&vs_currencies=${encodeURIComponent(currencies)}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;

        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });

        const data = await response.json();

        if (!data['mantra-dao']) {
          throw new Error('Token not found on CoinGecko');
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              token: 'MANTRA (OM)',
              coingecko_id: 'mantra-dao',
              ...data['mantra-dao'],
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error fetching token price: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}
