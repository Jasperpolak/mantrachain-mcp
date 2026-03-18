import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Address } from 'viem';
import { MantraClient } from '../mantra-client.js';
import * as services from '../evm-services/index.js';
import { networks } from '../config.js';
import { convertBigIntToString } from '../utils.js';
import { networkNameSchema, formatError } from './schemas.js';

export function registerBankTools(server: McpServer, mantraClient: MantraClient) {
  // Get Cosmos balance
  server.tool(
    "get-balance",
    "Get the Cosmos balance of an address on MANTRA Chain. The native token is called MANTRA (not OM). The base denomination is 'amantra' with 18 decimals. The block explorer is MantraScan (mantrascan.io).",
    {
      address: z.string().describe("The bech32 address to get balance for (e.g., 'mantra1...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        await mantraClient.initialize(networkName);
        const balance = await mantraClient.getBalance(address);
        return {
          content: [{type: "text", text: JSON.stringify(balance)}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching balance: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get EVM native balance
  server.tool(
    'get_evm_balance',
    'Get the native token balance (MANTRA) for an EVM address',
    {
      address: z.string().describe("The EVM wallet address (e.g., '0x1234...')"),
      networkName: networkNameSchema,
    },
    async ({ address, networkName }) => {
      try {
        const balance = await services.getBalance(address, networkName);
        return {
          content: [{type: "text", text: JSON.stringify(convertBigIntToString(balance))}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching balance: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get ERC20 token balance
  server.tool(
    'get_token_balance',
    'Get the balance of an ERC20 token for an address',
    {
      tokenAddress: z.string().describe("The contract address of the ERC20 token (e.g., '0x3894...')"),
      ownerAddress: z.string().describe("The wallet address to check the balance for (e.g., '0x1234...')"),
      networkName: networkNameSchema,
    },
    async ({ tokenAddress, ownerAddress, networkName }) => {
      try {
        const balance = await services.getERC20Balance(tokenAddress, ownerAddress, networkName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              tokenAddress,
              owner: ownerAddress,
              network: networkName,
              raw: balance.raw.toString(),
              formatted: balance.formatted,
              symbol: balance.token.symbol,
              decimals: balance.token.decimals
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching token balance: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get ERC721 NFT balance
  server.tool(
    'get_nft_balance',
    'Get the total number of ERC721 NFTs owned by an address from a specific collection',
    {
      tokenAddress: z.string().describe("The contract address of the NFT collection"),
      ownerAddress: z.string().describe("The wallet address to check the NFT balance for"),
      networkName: networkNameSchema,
    },
    async ({ tokenAddress, ownerAddress, networkName }) => {
      try {
        const balance = await services.getERC721Balance(tokenAddress as Address, ownerAddress as Address, networkName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              collection: tokenAddress,
              owner: ownerAddress,
              network: networkName,
              balance: balance.toString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching NFT balance: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );

  // Get ERC1155 token balance
  server.tool(
    'get_erc1155_balance',
    'Get the balance of a specific ERC1155 token ID owned by an address',
    {
      tokenAddress: z.string().describe("The contract address of the ERC1155 token collection"),
      tokenId: z.string().describe("The ID of the specific token to check the balance for"),
      ownerAddress: z.string().describe("The wallet address to check the token balance for"),
      networkName: networkNameSchema,
    },
    async ({ tokenAddress, tokenId, ownerAddress, networkName }) => {
      try {
        const balance = await services.getERC1155Balance(tokenAddress as Address, ownerAddress as Address, BigInt(tokenId), networkName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              contract: tokenAddress,
              tokenId,
              owner: ownerAddress,
              network: networkName,
              balance: balance.toString()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error fetching ERC1155 token balance: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
