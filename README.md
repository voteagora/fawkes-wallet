# REST-Controlled Ethereum Wallet

A headless WalletConnect-based wallet that can be controlled through REST API calls. 

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

There is a cli available, to control the wallet from the command line.  This is useful for troubleshooting the wallet itself.

You can run it with

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