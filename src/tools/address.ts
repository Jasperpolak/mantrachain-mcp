import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fromBech32, toBech32, toHex, fromHex } from '@cosmjs/encoding';
import { getAddress } from 'viem';
import { formatError } from './schemas.js';

export function registerAddressTools(server: McpServer) {
  server.tool(
    "convert_address",
    "Convert between MANTRA bech32 (mantra1...) and EVM (0x...) address formats. Works both ways.",
    {
      address: z.string().describe("The address to convert — either a bech32 address (e.g., 'mantra1...') or an EVM address (e.g., '0x...')"),
    },
    async ({ address }) => {
      try {
        let bech32Address: string;
        let evmAddress: string;

        if (address.startsWith('mantra1')) {
          const { data } = fromBech32(address);
          evmAddress = getAddress('0x' + toHex(data));
          bech32Address = address;
        } else if (address.startsWith('0x') || address.startsWith('0X')) {
          const hexStr = address.slice(2).toLowerCase();
          const data = fromHex(hexStr);
          bech32Address = toBech32('mantra', data);
          evmAddress = getAddress('0x' + hexStr);
        } else {
          throw new Error("Address must start with 'mantra1' (bech32) or '0x' (EVM)");
        }

        return {
          content: [{type: "text", text: JSON.stringify({ bech32: bech32Address, evm: evmAddress }, null, 2)}],
        };
      } catch (error) {
        return {
          content: [{type: 'text', text: `Error converting address: ${formatError(error)}`}],
          isError: true
        };
      }
    }
  );
}
