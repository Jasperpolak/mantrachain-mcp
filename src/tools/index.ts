import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MantraClient } from '../mantra-client.js';
import { registerBankTools } from './bank.js';
import { registerStakingTools } from './staking.js';
import { registerNetworkTools } from './network.js';
import { registerResources } from './resources.js';
import { registerContractTools } from './contract.js';
import { registerDexTools } from './dex.js';
import { registerTokenTools } from './token.js';
import { registerTxTools } from './tx.js';
import { registerCosmosTxTools } from './cosmos-tx.js';
import { registerAddressTools } from './address.js';
import { registerSupplyTools } from './supply.js';
import { registerBlockscoutTools } from './blockscout.js';

export { registerAllPrompts } from './prompts.js';

export function registerAllTools(server: McpServer, mantraClient: MantraClient) {
  // Register resources first
  registerResources(server);

  // Register read-only tools
  registerBankTools(server, mantraClient);
  registerStakingTools(server, mantraClient);
  registerNetworkTools(server, mantraClient);
  registerContractTools(server, mantraClient);
  registerDexTools(server, mantraClient);
  registerTokenTools(server);
  registerTxTools(server);

  // Phase 2 tools
  registerCosmosTxTools(server);
  registerAddressTools(server);
  registerSupplyTools(server);

  // Phase 3 tools (Blockscout-powered)
  registerBlockscoutTools(server, mantraClient);
}
