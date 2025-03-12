# REST-Controlled Ethereum Wallet

A headless Ethereum wallet that can be controlled entirely through REST API calls. This wallet implements WalletConnect v2 to connect with dApps, while providing a web interface to monitor its status and history.

## Quick Start

1. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

2. Create a `.env` file in the project root:
```bash
WALLET_CONNECT_PROJECT_ID=your_project_id_here
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
  -d '{"uri": "wc:6820b1a8b0c8587d39614fb092d27dd94f2d5839bc8a693bf5763376984b1ea2@2?expiryTimestamp=1741801199&relay-protocol=irn&symKey=4925457d9a9fb3bb73527abedbc9620fe06f540e0c2f4abfdb3d1ae1638e9ddc"}'
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
# Approve a request
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

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

3. Update the `projectId` in `src/server.js` with your WalletConnect Project ID

4. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000 by default.

## API Endpoints

### Create Wallet
Creates a new wallet or imports one from a mnemonic phrase.

```bash
# Generate new wallet
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json"

# Import existing wallet
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json" \
  -d '{"mnemonic": "your mnemonic phrase"}'
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
curl -X POST http://localhost:3000/wallet/approve-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'

# Reject request
curl -X POST http://localhost:3000/wallet/reject-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'
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
