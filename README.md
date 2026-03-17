# MANTRA Chain MCP Server

A **read-only** [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for querying [MANTRA Chain](https://www.mantrachain.io/) — a Cosmos SDK L1 blockchain with EVM support.

Built for non-technical team members to query the blockchain directly from [Claude Cowork](https://claude.ai/cowork) and other MCP-compatible clients, without needing CLI access or wallet credentials.

## Features

- 30 read-only tools across Cosmos and EVM layers
- No wallet or mnemonic required — fully read-only, no signing
- Supports mainnet (`mantra-1`) and testnet (`mantra-dukong-1`)
- Streamable HTTP transport for cloud deployment (Cloud Run, etc.)
- Stdio transport for local MCP clients (Claude Desktop, Cursor, etc.)
- Custom network support via environment variable

## Available Tools

### Balance Queries
| Tool | Description |
|------|-------------|
| `get-balance` | Get native token balance for a Cosmos address |
| `get_evm_balance` | Get native token balance for an EVM address |
| `get_token_balance` | Get ERC20 token balance |
| `get_nft_balance` | Get ERC721 NFT count for an address |
| `get_erc1155_balance` | Get ERC1155 token balance for a specific token ID |

### Staking
| Tool | Description |
|------|-------------|
| `get-validators` | List all validators |
| `get-delegations` | Get staking delegations for an address |
| `get-available-rewards` | Get unclaimed staking rewards |

### Network & Blocks
| Tool | Description |
|------|-------------|
| `get-block-info` | Get Cosmos block info (by height or latest) |
| `get-block-info-evm` | Get EVM block info |
| `query-network` | Execute a generic query against chain REST/RPC APIs |

### Cosmos Transactions
| Tool | Description |
|------|-------------|
| `search_cosmos_txs` | Search transactions by events (sender, recipient, height, msg type) |
| `get_cosmos_tx` | Get a single transaction by hash |
| `get_cosmos_txs_by_address` | Get all transactions for an address (sent + received) |

### EVM Transactions
| Tool | Description |
|------|-------------|
| `get_transaction` | Get EVM transaction details by hash |
| `get_transaction_receipt` | Get EVM transaction receipt |
| `estimate_gas` | Estimate gas for a transaction |

### Smart Contracts
| Tool | Description |
|------|-------------|
| `cosmwasm-contract-query` | Query a CosmWasm smart contract |
| `read_evm_contract` | Read from an EVM contract (view/pure) |
| `is_contract` | Check if an EVM address is a contract or EOA |

### DEX
| Tool | Description |
|------|-------------|
| `dex-get-pools` | List available liquidity pools |
| `dex-find-routes` | Find swap routes between two tokens |
| `dex-simulate-swap` | Simulate a swap (no execution) |

### Tokens & NFTs
| Tool | Description |
|------|-------------|
| `get_nft_info` | Get ERC721 NFT metadata |
| `check_nft_ownership` | Check if an address owns a specific NFT |
| `get_erc1155_token_uri` | Get ERC1155 token URI |
| `get_erc20_token_info` | Get ERC20 token name, symbol, decimals, supply |

### Utility
| Tool | Description |
|------|-------------|
| `convert_address` | Convert between bech32 (`mantra1...`) and EVM (`0x...`) formats |
| `get_token_supply` | Get total on-chain supply of MANTRA token |
| `get_token_price` | Get current MANTRA (OM) price from CoinGecko |

### Resources
| Resource | Description |
|----------|-------------|
| `networks://all` | All available networks and their configuration |
| `openapi://{networkName}` | OpenAPI spec for a network's REST API |

## Quick Start

### Run locally (stdio)

```bash
npx mantrachain-mcp@latest
```

### Run locally (HTTP)

```bash
npx mantrachain-mcp@latest -- --http
# Server starts on http://localhost:3000
```

### Build from source

```bash
git clone https://github.com/anthropics/mantrachain-mcp.git
cd mantrachain-mcp
npm install
npm run build
npm start          # stdio mode
npm run start-http # HTTP mode
```

## MCP Client Configuration

### Claude Desktop / Cursor / Claude Code (stdio)

Add to your MCP client config:

```json
{
  "mcpServers": {
    "mantrachain": {
      "command": "npx",
      "args": ["-y", "mantrachain-mcp@latest"]
    }
  }
}
```

### Claude Cowork / Remote clients (HTTP)

Deploy to Cloud Run (or any host), then connect via the Streamable HTTP endpoint:

```
https://your-cloud-run-url.run.app/mcp
```

### Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/mcp` | `POST` | Streamable HTTP MCP endpoint |
| `/health` | `GET` | Health check (returns 200) |

## Docker

```bash
docker build -t mantrachain-mcp .
docker run -p 3000:3000 mantrachain-mcp
```

## Deploy to Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/mantrachain-mcp

# Deploy
gcloud run deploy mantrachain-mcp \
  --image gcr.io/YOUR_PROJECT/mantrachain-mcp \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CUSTOM_NETWORKS` | No | JSON string with additional network configs |
| `PORT` | No | HTTP port (default: `3000`, auto-set by Cloud Run) |

### Custom Network Example

```bash
export CUSTOM_NETWORKS='{"my-net":{"rpcEndpoint":"https://rpc.example.com","apiEndpoint":"https://api.example.com","chainId":"my-net-1","prefix":"custom","denom":"ucustom","gasPrice":"0.01","isMainnet":false}}'
```

## Networks

| Network | Chain ID | Default | Type |
|---------|----------|---------|------|
| `mantra-1` | `mantra-1` | Yes | Mainnet |
| `mantra-dukong-1` | `mantra-dukong-1` | No | Testnet |

## License

MIT
