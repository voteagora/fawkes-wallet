# Fawkes Wallet

**A CLI & HTTP Controlled WalletConnect Wallet**

A headless WalletConnect-based wallet that can be controlled through HTTP API calls using any HTTP client (curl, python, etc) or the provided CLI. 

This wallet implements WalletConnect v2 to connect with dApps, while providing an optional web interface to monitor its status and history. 

## Working Features

### Reliable

- [x] Create random wallet from random mnemonic, use first address
- [x] Create wallet from user-provided mnemonic, use first address
- [x] Create impersonated wallet from address, use it as read-only
- [x] Sign messages - with actual account
- [x] Send transactions - with actual account

### Alpha

It's unclear if we're using the WalletConnect V2 API correctly, but it seems to function.

- [x] Sign messages - with impersonated accounts
- [x] Send transactions - with impersonated accounts

## Planned Features
- [ ] Dockerize it, publish builds
- [ ] Create wallet from user-provided private keys
- [ ] Manage more than one wallet at once
- [ ] Persistent key storage
- [ ] Authentication
- [ ] Create random wallets from mnemonic, use specific/addressable addresses
- [ ] Attempt to decode proposed transactions using ABIs
- [ ] Friendlier Monitoring
- [ ] Auto-sign mode
- [ ] Control over gas

## Quick Start

1. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

2. Create a `.env` file in the project root:
```bash
WALLET_CONNECT_PROJECT_ID=your_project_id_here
JSON_RPC_URL=http://localhost:9000
PORT=3000
```

3. Install dependencies and start the server:
```bash
npm install
npm start
```

4. Create a new wallet:
```bash
curl -X POST http://localhost:3000/wallet/create
```

5. Open http://localhost:3000 in your browser to see the wallet status

6. To test with a dApp:
   - Go to any WalletConnect-enabled dApp
   - Select WalletConnect as your connection method
   - Copy the connection URI (starts with "wc:")
   - Connect using the URI:
```bash
curl -X POST http://localhost:3000/wallet/connect -H "Content-Type: application/json" \
  -d '{"uri": "wc:..."}'
```

7. Use the API to approve/reject the connection:
```bash
# Approve the connection
curl -X POST http://localhost:3000/wallet/approve-session

# Or reject it
curl -X POST http://localhost:3000/wallet/reject-session
```

8. Use the API to approve/reject transaction and signature requests:
```bash
# Approve the a request (FIFO)
curl -X POST http://localhost:3000/wallet/approve-request

# Approve a specific request
curl -X POST http://localhost:3000/wallet/approve-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'

# Or reject it
curl -X POST http://localhost:3000/wallet/reject-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'
```

9. Check wallet status:
```bash
curl http://localhost:3000/wallet/status
```


## API Endpoints

### Create Wallet
Creates a new wallet or imports one from a mnemonic phrase.

```bash
# Generate new wallet, from a random mnemonic
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json"

# Import existing wallet from a mnemonic
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json" \
  -d '{"mnemonic": "your mnemonic phrase"}'

# Impersonate a wallet from a known address:
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890123456789012345678901234567890"}'

```

### Connect to dApp
Connect to a dApp using WalletConnect URI.

```bash
curl -X POST http://localhost:3000/wallet/connect -H "Content-Type: application/json" \
  -d '{"uri": "wc:..."}'
```

### Manage Sessions
Approve or reject WalletConnect session proposals.

```bash
# Approve session
curl -X POST http://localhost:3000/wallet/approve-session

# Reject session
curl -X POST http://localhost:3000/wallet/reject-session
```

### Handle Transaction Requests
Approve or reject transaction and signature requests.

```bash
# Approve request
curl -X POST http://localhost:3000/wallet/approve-request -H "Content-Type: application/json" -d '{"requestId": "request_id"}'

# Reject request
curl -X POST http://localhost:3000/wallet/reject-request -H "Content-Type: application/json" -d '{"requestId": "request_id"}'
```

### Check Wallet Status
Get the current wallet status, including pending requests and history.

```bash
curl http://localhost:3000/wallet/status
```

## Web Interface

A web interface is available at http://localhost:3000 that shows:
- Current wallet status and address
- Pending requests that need approval/rejection
- History of all wallet actions

The interface automatically updates every 2 seconds.

## Implementation Details

- Built with Node.js and Express
- Uses WalletConnect v2 for dApp connections
- Uses ethers.js v6 for Ethereum interactions
- All state is stored in RAM (no persistence)
- Supports signing messages and transactions

## Security Considerations

- This is a demonstration wallet and should not be used with significant amounts of cryptocurrency
- All state is stored in RAM and will be lost when the server restarts
- No authentication is implemented on the REST endpoints
- Private keys are held in memory

## CLI

There is a cli available, to control the wallet from the command line using the same .env configured with the server.  

This is useful for troubleshooting the wallet itself or for certain flows in your app.

```
npm run cli
```

The cli will show you a list of commands you can use:
```
  create [options]           Create a new wallet
  connect [options]          Connect to a dApp using WalletConnect
  approve-session            Approve an incoming session request
  reject-session             Reject an incoming session request
  approve-request [options]  Approve a transaction request
  reject-request [options]   Reject a transaction request
  status                     Get wallet status
  help [command]             display help for command
```

Example commands in order of a typical flow:

```
% node src/cli.js create
Wallet created successfully:
{
  "address": "0x4033Bd6759cAD2E1691F6E18E1D8c1B15e3beC69",
  "mnemonic": "exotic price notice pony stay popular disorder screen embrace normal power planet"
}
```

```
% node src/cli.js connect -u "wc:2f4d8871dd30e800260a34a4ea8dba61b6f49065d748adeb7e80b28488f45578@2?expiryTimestamp=1742261439&relay-protocol=irn&symKey=2f72848d5d5330a9b62424f6c63b42f0ff7112cdeadfc8da0c185b1bbb5602ef"
Connection initiated:
{
  "success": true
}
```

```
% node src/cli.js approve-session
Session approved:
{
  "success": true,
  "session": {
    "relay": {
      "protocol": "irn"
    },
    "namespaces": {
      "eip155": {
        "chains": [
          "eip155:1"
        ],
        "methods": [
          "eth_accounts",
          "eth_requestAccounts",
          "eth_sendRawTransaction",
          "eth_sign",
          "eth_signTransaction",
          "eth_signTypedData",
          "eth_signTypedData_v3",
          "eth_signTypedData_v4",
          "eth_sendTransaction",
          "personal_sign",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
          "wallet_getPermissions",
          "wallet_requestPermissions",
          "wallet_registerOnboarding",
          "wallet_watchAsset",
          "wallet_scanQRCode",
          "wallet_sendCalls",
          "wallet_getCapabilities",
          "wallet_getCallsStatus",
          "wallet_showCallsStatus"
        ],
        "events": [
          "chainChanged",
          "accountsChanged",
          "message",
          "disconnect",
          "connect"
        ],
        "accounts": [
          "eip155:1:0x4033Bd6759cAD2E1691F6E18E1D8c1B15e3beC69"
        ]
      }
    },
    "controller": "e119404e26da4bc0df3d302b30cf63c31e4d13a0cc09fbb0ff2056df459d1225",
    "expiry": 1742865954,
    "topic": "13d79ad82cb7205abbd4edefc834792bde4a4af98d7202e06792765971e06f50",
    "requiredNamespaces": {},
    "optionalNamespaces": {
      "eip155": {
        "chains": [
          "eip155:1"
        ],
        "methods": [
          "eth_accounts",
          "eth_requestAccounts",
          "eth_sendRawTransaction",
          "eth_sign",
          "eth_signTransaction",
          "eth_signTypedData",
          "eth_signTypedData_v3",
          "eth_signTypedData_v4",
          "eth_sendTransaction",
          "personal_sign",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
          "wallet_getPermissions",
          "wallet_requestPermissions",
          "wallet_registerOnboarding",
          "wallet_watchAsset",
          "wallet_scanQRCode",
          "wallet_sendCalls",
          "wallet_getCapabilities",
          "wallet_getCallsStatus",
          "wallet_showCallsStatus"
        ],
        "events": [
          "chainChanged",
          "accountsChanged",
          "message",
          "disconnect",
          "connect"
        ],
        "rpcMap": {
          "1": "https://eth-mainnet.g.alchemy.com/v2/5a1..."
        }
      }
    },
    "pairingTopic": "2f4d8871dd30e800260a34a4ea8dba61b6f49065d748adeb7e80b28488f45578",
    "acknowledged": false,
    "self": {
      "publicKey": "e119404e26da4bc0df3d302b30cf63c31e4d13a0cc09fbb0ff2056df459d1225",
      "metadata": {
        "name": "CLI & HTTP Wallet",
        "description": "A CLI & HTTP API-controlled Ethereum wallet",
        "url": "http://localhost:3001",
        "icons": [
          "https://walletconnect.org/walletconnect-logo.png"
        ]
      }
    },
    "peer": {
      "publicKey": "e9881088d2f2c1387bca243ec67c1d51e6b1a97aceb5177a27dd2bfd4b2d4434",
      "metadata": {
        "description": "Home of token governance",
        "url": "https://vote.uniswapfoundation.org",
        "icons": [
          "https://vote.uniswapfoundation.org/icon.png?c9ea8379a2e802f2",
          "https://vote.uniswapfoundation.org/favicon/apple-touch-icon.png",
          "https://vote.uniswapfoundation.org/favicon/favicon-32x32.png",
          "https://vote.uniswapfoundation.org/favicon/favicon-16x16.png",
          "https://vote.uniswapfoundation.org/favicon/safari-pinned-tab.svg",
          "https://vote.uniswapfoundation.org/favicon/favicon.ico"
        ],
        "name": "Uniswap Agora"
      }
    },
    "transportType": "relay"
  }
}
```

```
% node src/cli.js approve-request
Request approved:
{
  "success": true,
  "result": "0x52205048924e9ff69df794cab5b854d6dfaac732ed0f1b753f5e307355bcc8ee2ca0af73364a5b82b423ee88d5b985c9642c575d75115aade2bf9eab9bdaea591c"
}
```