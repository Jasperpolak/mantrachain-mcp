import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { networks } from '../config.js';

/**
 * Register all prompts with the MCP server (read-only only)
 */
export function registerAllPrompts(server: McpServer) {
  // Block explorer prompt
  server.prompt(
    'explore_block',
    'Explore information about a specific block on MANTRA Chain',
    {
      blockNumber: z.string().optional().describe('Block number to explore. If not provided, latest block will be used.'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use. Defaults to `mantra-1` mainnet."),
    },
    ({ blockNumber, networkName }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: blockNumber
            ? `Please analyze block #${blockNumber} on the ${networkName} network and provide information about its key metrics, transactions, and significance.`
            : `Please analyze the latest block on the ${networkName} network and provide information about its key metrics, transactions, and significance.`
        }
      }]
    })
  );

  // Transaction analysis prompt
  server.prompt(
    'analyze_transaction',
    'Analyze a specific transaction on MANTRA Chain',
    {
      txHash: z.string().describe('Transaction hash to analyze'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use. Defaults to `mantra-1` mainnet."),
    },
    ({ txHash, networkName }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please analyze transaction ${txHash} on the ${networkName} network and provide a detailed explanation of what this transaction does, who the parties involved are, the amount transferred (if applicable), gas used, and any other relevant information.`
        }
      }]
    })
  );

  // Address analysis prompt
  server.prompt(
    'analyze_address',
    'Analyze a MANTRA Chain address',
    {
      address: z.string().describe('MANTRA address to analyze (bech32 mantra1... or EVM 0x...)'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use. Defaults to `mantra-1` mainnet."),
    },
    ({ address, networkName }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please analyze the address ${address} on the ${networkName} network. Provide information about its balance, transaction count, and any other relevant information you can find.`
        }
      }]
    })
  );

  // Smart contract interaction guidance
  server.prompt(
    'interact_with_contract',
    'Get guidance on reading a smart contract on MANTRA Chain',
    {
      contractAddress: z.string().describe('The contract address'),
      abiJson: z.string().optional().describe('The contract ABI as a JSON string'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use. Defaults to `mantra-1` mainnet."),
    },
    ({ contractAddress, abiJson, networkName }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: abiJson
            ? `I need to query the smart contract at address ${contractAddress} on the ${networkName} network. Here's the ABI:\n\n${abiJson}\n\nPlease analyze this contract's read-only functions and provide guidance on how to query it.`
            : `I need to query the smart contract at address ${contractAddress} on the ${networkName} network. Please help me understand what this contract does and how I can read data from it.`
        }
      }]
    })
  );

  // EVM concept explanation
  server.prompt(
    'explain_evm_concept',
    'Get an explanation of an EVM concept',
    {
      concept: z.string().describe('The EVM concept to explain (e.g., gas, nonce, etc.)')
    },
    ({ concept }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please explain the EVM Blockchain concept of "${concept}" in detail. Include how it works, why it's important, and provide examples if applicable.`
        }
      }]
    })
  );

  // Token analysis prompt
  server.prompt(
    'analyze_token',
    'Analyze an ERC20 or NFT token on MANTRA Chain',
    {
      tokenAddress: z.string().describe('Token contract address to analyze'),
      tokenType: z.string().optional().describe('Type of token to analyze (erc20, erc721/nft, or auto-detect). Defaults to auto.'),
      tokenId: z.string().optional().describe('Token ID (required for NFT analysis)'),
      networkName: z.string().refine(val => Object.keys(networks).includes(val), {
        message: "Must be a valid network name"
      }).describe("Name of the network to use. Defaults to `mantra-1` mainnet."),
    },
    ({ tokenAddress, tokenType = 'auto', tokenId, networkName }) => {
      let promptText = '';

      if (tokenType === 'erc20' || tokenType === 'auto') {
        promptText = `Please analyze the ERC20 token at address ${tokenAddress} on the ${networkName} network. Provide information about its name, symbol, total supply, and any other relevant details.`;
      } else if ((tokenType === 'erc721' || tokenType === 'nft') && tokenId) {
        promptText = `Please analyze the NFT with token ID ${tokenId} from the collection at address ${tokenAddress} on the ${networkName} network.`;
      } else if (tokenType === 'nft' || tokenType === 'erc721') {
        promptText = `Please analyze the NFT collection at address ${tokenAddress} on the ${networkName} network.`;
      }

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: promptText
          }
        }]
      };
    }
  );
}
