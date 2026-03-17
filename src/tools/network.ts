import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as services from '../evm-services/index.js';
import { MantraClient } from '../mantra-client.js';
import { networks } from '../config.js';
import { networkNameSchema, formatError } from './schemas.js';

export function registerNetworkTools(server: McpServer, mantraClient: MantraClient) {
  // Get Cosmos block info
  server.tool(
    "get-block-info",
    "Get block information from MANTRA Chain CometBFT RPC",
    {
      networkName: networkNameSchema,
      height: z.number().optional().describe("Optional block height to query, defaults to latest block"),
    },
    async ({ networkName, height }) => {
      await mantraClient.initialize(networkName);
      const currentBlockInfo = await mantraClient.getBlockInfo(height);
      return {
        content: [{type: "text", text: JSON.stringify(currentBlockInfo)}],
      };
    }
  );

  // Get EVM block info
  server.tool(
    'get-block-info-evm',
    'Get block information from MANTRA Chain EVM RPC',
    {
      networkName: networkNameSchema,
      height: z.number().optional().describe("Optional block height to query, defaults to latest block"),
    },
    async ({ height, networkName }) => {
      try {
        const block = await services.getBlockByNumber(height, networkName);
        return {
          content: [{type: 'text', text: services.helpers.formatJson(block)}]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching block ${height}: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Generic network query
  server.tool(
    "query-network",
    "Execute a generic gRPC Gateway query against MANTRA Chain APIs. Check available endpoints by reading `openapi://{networkName}` first.",
    {
      networkName: networkNameSchema,
      path: z.string().describe("API endpoint path from the OpenAPI spec, e.g., '/cosmos/bank/v1beta1/balances/{address}'"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("HTTP method to use for the request"),
      pathParams: z.record(z.string()).optional().describe("Path parameters to substitute in the URL path"),
      queryParams: z.record(z.string()).optional().describe("Query parameters to add to the request"),
      body: z.any().optional().describe("Request body for POST/PUT requests"),
    },
    async ({ networkName, path, method, pathParams, queryParams, body }) => {
      try {
        await mantraClient.initialize(networkName);

        let url = networks[networkName].apiEndpoint.replace(/\/+$/, '');

        if (pathParams) {
          let substitutedPath = path;
          for (const [key, value] of Object.entries(pathParams)) {
            substitutedPath = substitutedPath.replace(`{${key}}`, encodeURIComponent(String(value)));
          }
          url += substitutedPath;
        } else {
          url += path;
        }

        if (queryParams && Object.keys(queryParams).length > 0) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(queryParams)) {
            params.append(key, String(value));
          }
          url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();
        return {
          content: [{type: "text", text: JSON.stringify(data)}],
        };
      } catch (error) {
        throw new Error(`Failed to execute network query: ${formatError(error)}`);
      }
    }
  );
}
