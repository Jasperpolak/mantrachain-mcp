import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address } from 'viem';
import * as services from '../evm-services/index.js';
import { MantraClient } from '../mantra-client.js';
import { networkNameSchema, formatError } from './schemas.js';

export function registerContractTools(server: McpServer, mantraClient: MantraClient) {
  // CosmWasm contract query
  server.tool(
    "cosmwasm-contract-query",
    "Query a CosmWasm smart contract by executing a read-only function on MANTRA Chain",
    {
      contractAddress: z.string().describe("Address of the CosmWasm contract to query"),
      queryMsg: z.record(z.any()).describe("The query message to send to the contract as a JSON object"),
      networkName: networkNameSchema,
    },
    async ({ contractAddress, queryMsg, networkName }) => {
      await mantraClient.initialize(networkName);

      try {
        const result = await mantraClient.queryContract({contractAddress, queryMsg});
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}],
        };
      } catch (error: any) {
        return {
          content: [{type: "text", text: `Error querying contract: ${error.message || JSON.stringify(error)}`}],
        };
      }
    }
  );

  // Read EVM contract
  server.tool(
    'read_evm_contract',
    "Read data from an EVM contract by calling a view/pure function. This doesn't modify blockchain state.",
    {
      contractAddress: z.string().describe('The address of the EVM contract to interact with'),
      abi: z.array(z.unknown()).describe('The ABI of the smart contract function, as a JSON array'),
      functionName: z.string().describe("The name of the function to call (e.g., 'balanceOf')"),
      args: z.array(z.unknown()).optional().describe("The arguments to pass to the function, as an array"),
      networkName: networkNameSchema,
    },
    async ({ contractAddress, abi, functionName, args = [], networkName }) => {
      try {
        const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;

        const result = await services.readContract(
          { address: contractAddress as Address, abi: parsedAbi, functionName, args },
          networkName
        );

        return {
          content: [{type: 'text', text: services.helpers.formatJson(result)}]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error reading contract: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Check if address is a contract
  server.tool(
    'is_contract',
    'Check if an EVM address is a smart contract or an externally owned account (EOA)',
    {
      address: z.string().describe("The wallet or contract address to check (e.g., '0x1234...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        const result = await services.isContract(address, networkName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              address,
              network: networkName,
              isContract: result,
              type: result ? 'Contract' : 'Externally Owned Account (EOA)'
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error checking if address is a contract: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
