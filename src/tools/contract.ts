import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address, Hex } from 'viem';
import * as services from '../evm-services/index.js';
import { MantraClient } from '../mantra-client.js';
import { convertBigIntToString } from '../utils.js';
import { networkNameSchema, formatError } from './schemas.js';
import { isPreEvmBlock, EVM_ACTIVATION_BLOCK, MAX_LOG_RANGE } from '../evm-archive-fallback.js';

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
      } catch (error) {
        return {
          content: [{type: "text", text: `Error querying contract: ${formatError(error)}`}],
          isError: true,
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
      blockNumber: z.number().optional().describe("Block number to read state at (for historical queries). Omit for latest block."),
      networkName: networkNameSchema,
    },
    async ({ contractAddress, abi, functionName, args = [], blockNumber, networkName }) => {
      try {
        // Pre-EVM block: no EVM contracts existed
        if (blockNumber !== undefined && isPreEvmBlock(blockNumber)) {
          return {
            content: [{type: 'text', text: JSON.stringify({
              error: 'pre_evm_block',
              message: `Block ${blockNumber.toLocaleString()} is before EVM activation at block ${EVM_ACTIVATION_BLOCK.toLocaleString()} (Abunnati upgrade, Sep 2025). No EVM contract state exists for this block. EVM contracts were not deployed until after the upgrade.`,
              suggestion: 'Use CosmWasm contract query (cosmwasm-contract-query) or Cosmos transaction tools for pre-EVM data.',
            }, null, 2)}],
          };
        }

        const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;

        const result = await services.readContract(
          {
            address: contractAddress as Address,
            abi: parsedAbi,
            functionName,
            args,
            ...(blockNumber !== undefined ? { blockNumber: BigInt(blockNumber) } : {}),
          },
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

  // Get EVM logs (eth_getLogs)
  server.tool(
    'get_evm_logs',
    "Query EVM event logs using eth_getLogs. Filter by contract address, block range, and/or event topics. Useful for tracking transfers, swaps, and other contract events.",
    {
      address: z.string().optional().describe("Contract address to filter logs from (e.g., '0x1234...'). Omit to get logs from all contracts."),
      fromBlock: z.number().optional().describe("Start block number (inclusive). Omit for latest."),
      toBlock: z.number().optional().describe("End block number (inclusive). Omit for latest."),
      blockHash: z.string().optional().describe("Specific block hash to get logs from. Cannot be used with fromBlock/toBlock."),
      topics: z.array(z.union([z.string(), z.array(z.string()), z.null()])).optional().describe("Array of topic filters. Each element is a topic hash, an array of topic hashes (OR), or null (wildcard)."),
      networkName: networkNameSchema,
    },
    async ({ address, fromBlock, toBlock, blockHash, topics, networkName }) => {
      try {
        let adjustedFrom = fromBlock;
        let adjustedTo = toBlock;
        let boundaryNote: string | undefined;

        // Pre-EVM block range: no EVM logs existed
        if (adjustedFrom !== undefined && isPreEvmBlock(adjustedFrom)) {
          if (adjustedTo !== undefined && isPreEvmBlock(adjustedTo)) {
            return {
              content: [{type: 'text', text: JSON.stringify({
                error: 'pre_evm_block',
                message: `Block range ${adjustedFrom.toLocaleString()}-${adjustedTo.toLocaleString()} is before EVM activation at block ${EVM_ACTIVATION_BLOCK.toLocaleString()} (Abunnati upgrade, Sep 2025). No EVM event logs exist for this range.`,
                suggestion: 'Use Cosmos transaction search (search_cosmos_txs) for pre-EVM event data.',
              }, null, 2)}],
            };
          }
          // Adjust fromBlock to EVM activation if range spans the boundary
          boundaryNote = `fromBlock adjusted from ${adjustedFrom.toLocaleString()} to ${EVM_ACTIVATION_BLOCK.toLocaleString()} (EVM activation boundary).`;
          adjustedFrom = EVM_ACTIVATION_BLOCK;
        }

        // Clamp range to MAX_LOG_RANGE blocks (RPC limit for eth_getLogs)
        if (adjustedFrom !== undefined && adjustedTo !== undefined && (adjustedTo - adjustedFrom) > MAX_LOG_RANGE) {
          const originalTo = adjustedTo;
          adjustedTo = adjustedFrom + MAX_LOG_RANGE;
          boundaryNote = (boundaryNote ? boundaryNote + ' ' : '') +
            `toBlock clamped from ${originalTo.toLocaleString()} to ${adjustedTo.toLocaleString()} (RPC max range: ${MAX_LOG_RANGE.toLocaleString()} blocks). Query additional ranges to get more logs.`;
        }

        const params: any = {};
        if (address) params.address = address as Address;
        if (blockHash) {
          params.blockHash = blockHash as Hex;
        } else {
          if (adjustedFrom !== undefined) params.fromBlock = BigInt(adjustedFrom);
          if (adjustedTo !== undefined) params.toBlock = BigInt(adjustedTo);
        }
        if (topics) params.topics = topics;

        const logs = await services.getLogs(params, networkName);
        const result: any = convertBigIntToString(logs);

        if (boundaryNote) {
          return {
            content: [{type: 'text', text: JSON.stringify({
              _note: boundaryNote,
              log_count: Array.isArray(result) ? result.length : 0,
              logs: result,
            }, null, 2)}]
          };
        }

        return {
          content: [{type: 'text', text: JSON.stringify(result, null, 2)}]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching logs: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
