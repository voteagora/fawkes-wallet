<p align="center">
  <img src="public/fawkes-logo.svg" width="160" alt="Fawkes Wallet"/>
</p>

<h1 align="center">Fawkes Wallet</h1>

<p align="center">
  <em>The wallet that wears a mask so your CI doesn't have to.</em>
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node-%3E%3D18-339933?logo=node.js&logoColor=white">
  <img alt="WalletConnect" src="https://img.shields.io/badge/WalletConnect-v2-3B99FC?logo=walletconnect&logoColor=white">
  <img alt="ethers" src="https://img.shields.io/badge/ethers.js-v6-2535A0">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue">
  <img alt="Built by Agora" src="https://img.shields.io/badge/built%20by-Agora-E8823A">
</p>

```text
╔═╗╔═╗╦ ╦╦╔═╔═╗╔═╗
╠╣ ╠═╣║║║╠╩╗╠╣ ╚═╗
╚  ╩ ╩╚╩╝╩ ╩╚═╝╚═╝
  remember, remember… to test your dApp
```

A **headless, browserless, human-less** WalletConnect v2 wallet that you drive entirely over an
HTTP API or a CLI. No extension to click. No popup to babysit. Point it at a dApp, script the
approvals, and let your test rig do the signing.

MetaMask's logo is a fox. Ours is a fox **in a mask** — because Fawkes' party trick is
**impersonation**: spin up a read-only wallet from *any* on-chain address and have your suite act as
it. Sign anything, send anything, automate everything.

> Built for CI/CD test rigs by the team at **[Agora](https://voteagora.com)** — home of onchain
> governance. We needed a wallet that never sleeps and never clicks "Confirm." So we made one.

---

## Why test rigs love it

- 🎭 **Impersonate any address** — read-only wallets from a bare address, perfect for fork &
  mainnet-state testing without a single private key.
- 🤖 **No browser, no extension, no human** — pure HTTP + CLI, drops straight into your pipeline.
- ⚡ **Scriptable approvals** — approve/reject sessions and requests FIFO or by specific `requestId`.
- 🧪 **Deterministic & disposable** — all state lives in RAM, so every run starts clean and vanishes
  when the container stops. A feature, not a bug.
- 🐳 **Dockerized** — one image, drop it in your `docker-compose`, done.
- ✍️ **Signs everything** — messages and transactions, with real *or* impersonated accounts.

## Working Features

- [x] Create a random wallet from a random mnemonic (uses the first address)
- [x] Create a wallet from a user-provided mnemonic (uses the first address)
- [x] Create an **impersonated** wallet from an address (read-only)
- [x] Sign messages — with the real account
- [x] Send transactions — with the real account
- [x] Send transactions — with impersonated accounts
- [x] Dockerize it

## Quick Start

1. Grab a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

2. Create a `.env` file in the project root:

```bash
WALLET_CONNECT_PROJECT_ID=your_project_id_here
JSON_RPC_URL=http://localhost:9000
PORT=3000
```

3. Install and start the server:

```bash
npm install
npm start
```

4. Mint a fresh identity:

```bash
curl -X POST http://localhost:3000/wallet/create
```

5. Open <http://localhost:3000> to watch the wallet's status in real time.

6. Point it at a dApp — grab the WalletConnect URI (it starts with `wc:`) and hand it over:

```bash
curl -X POST http://localhost:3000/wallet/connect -H "Content-Type: application/json" \
  -d '{"uri": "wc:..."}'
```

7. Decide its fate — approve or reject the session:

```bash
# Approve the connection
curl -X POST http://localhost:3000/wallet/approve-session

# …or reject it
curl -X POST http://localhost:3000/wallet/reject-session
```

8. Approve or reject incoming transaction & signature requests:

```bash
# Approve the next request (FIFO)
curl -X POST http://localhost:3000/wallet/approve-request

# Approve a specific request
curl -X POST http://localhost:3000/wallet/approve-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'

# …or reject one
curl -X POST http://localhost:3000/wallet/reject-request -H "Content-Type: application/json" \
  -d '{"requestId": "request_id"}'
```

9. Check in on it any time:

```bash
curl http://localhost:3000/wallet/status
```

## …or with Docker

```bash
docker build -t fawkes-wallet .
docker run -d -p 4000:4000 \
       -e WALLET_CONNECT_PROJECT_ID=your_project_id_here \
       -e JSON_RPC_URL=http://localhost:9000 \
       -e PORT=4000 \
       fawkes-wallet
```

## API Endpoints

Every move the wallet makes is a single HTTP call away.

| Method | Endpoint                  | What it does                                          |
| ------ | ------------------------- | ----------------------------------------------------- |
| `POST` | `/wallet/create`          | Create a new wallet, import a mnemonic, or impersonate |
| `POST` | `/wallet/connect`         | Connect to a dApp via a WalletConnect URI             |
| `POST` | `/wallet/approve-session` | Approve a pending session proposal                    |
| `POST` | `/wallet/reject-session`  | Reject a pending session proposal                     |
| `POST` | `/wallet/approve-request` | Approve a transaction/signature request               |
| `POST` | `/wallet/reject-request`  | Reject a transaction/signature request                |
| `GET`  | `/wallet/status`          | Current status, pending requests, and history         |

### Create Wallet

Create a new wallet, import one from a mnemonic, or slip on a mask and impersonate an address.

```bash
# Generate a new wallet from a random mnemonic
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json"

# Import an existing wallet from a mnemonic
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json" \
  -d '{"mnemonic": "your mnemonic phrase"}'

# Impersonate a wallet from a known address (read-only)
curl -X POST http://localhost:3000/wallet/create -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890123456789012345678901234567890"}'
```

### Connect to a dApp

```bash
curl -X POST http://localhost:3000/wallet/connect -H "Content-Type: application/json" \
  -d '{"uri": "wc:..."}'
```

### Manage Sessions

```bash
# Approve session
curl -X POST http://localhost:3000/wallet/approve-session

# Reject session
curl -X POST http://localhost:3000/wallet/reject-session
```

### Handle Transaction Requests

```bash
# Approve request
curl -X POST http://localhost:3000/wallet/approve-request -H "Content-Type: application/json" -d '{"requestId": "request_id"}'

# Reject request
curl -X POST http://localhost:3000/wallet/reject-request -H "Content-Type: application/json" -d '{"requestId": "request_id"}'
```

### Check Wallet Status

```bash
curl http://localhost:3000/wallet/status
```

## Web Interface

A live dashboard is available at <http://localhost:3000>, showing:

- Current wallet status and address
- Pending requests awaiting your verdict
- A full history of everything the wallet has done

It refreshes itself every 2 seconds, so you can lean back and watch.

## CLI

Prefer the terminal? There's a CLI that drives the same wallet using the same `.env` as the server —
handy for troubleshooting the wallet itself or for certain flows in your app.

```bash
npm run cli
```

It'll list everything it can do:

```text
  create [options]           Create a new wallet
  connect [options]          Connect to a dApp using WalletConnect
  approve-session            Approve an incoming session request
  reject-session             Reject an incoming session request
  approve-request [options]  Approve a transaction request
  reject-request [options]   Reject a transaction request
  status                     Get wallet status
  help [command]             display help for command
```

A typical flow, start to finish:

```bash
% node src/cli.js create
Wallet created successfully:
{
  "address": "0x4033Bd6759cAD2E1691F6E18E1D8c1B15e3beC69",
  "mnemonic": "exotic price notice pony stay popular disorder screen embrace normal power planet"
}
```

```bash
% node src/cli.js connect -u "wc:2f4d8871dd30e800260a34a4ea8dba61b6f49065d748adeb7e80b28488f45578@2?expiryTimestamp=1742261439&relay-protocol=irn&symKey=2f72848d5d5330a9b62424f6c63b42f0ff7112cdeadfc8da0c185b1bbb5602ef"
Connection initiated:
{
  "success": true
}
```

```bash
% node src/cli.js approve-session
Session approved ✅
```

<details>
<summary>Full <code>approve-session</code> response (click to expand)</summary>

```json
{
  "success": true,
  "session": {
    "relay": { "protocol": "irn" },
    "namespaces": {
      "eip155": {
        "chains": ["eip155:1"],
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
        "events": ["chainChanged", "accountsChanged", "message", "disconnect", "connect"],
        "accounts": ["eip155:1:0x4033Bd6759cAD2E1691F6E18E1D8c1B15e3beC69"]
      }
    },
    "controller": "e119404e26da4bc0df3d302b30cf63c31e4d13a0cc09fbb0ff2056df459d1225",
    "expiry": 1742865954,
    "topic": "13d79ad82cb7205abbd4edefc834792bde4a4af98d7202e06792765971e06f50",
    "self": {
      "publicKey": "e119404e26da4bc0df3d302b30cf63c31e4d13a0cc09fbb0ff2056df459d1225",
      "metadata": {
        "name": "CLI & HTTP Wallet",
        "description": "A CLI & HTTP API-controlled Ethereum wallet",
        "url": "http://localhost:3001"
      }
    },
    "peer": {
      "publicKey": "e9881088d2f2c1387bca243ec67c1d51e6b1a97aceb5177a27dd2bfd4b2d4434",
      "metadata": {
        "description": "Home of token governance",
        "url": "https://vote.uniswapfoundation.org",
        "name": "Uniswap Agora"
      }
    },
    "transportType": "relay"
  }
}
```

</details>

```bash
% node src/cli.js approve-request
Request approved:
{
  "success": true,
  "result": "0x52205048924e9ff69df794cab5b854d6dfaac732ed0f1b753f5e307355bcc8ee2ca0af73364a5b82b423ee88d5b985c9642c575d75115aade2bf9eab9bdaea591c"
}
```

> Approving/rejecting a specific request? Pass `-i <requestId>` (it uses the latest request if you
> don't).

## Implementation Details

- Built with **Node.js** and **Express**
- **WalletConnect v2** for dApp connections
- **ethers.js v6** for all Ethereum interactions
- All state lives in **RAM** — nothing is persisted
- Signs both messages and transactions

## Security Considerations

Fawkes keeps its secrets in RAM and forgets them by morning. Treat it accordingly:

- This is a **demonstration / test wallet** — don't point it at significant funds.
- All state is in memory and is **lost on restart** (great for ephemeral CI, terrible for savings).
- There is **no authentication** on the REST endpoints.
- Private keys are held in memory.

In short: perfect for a test rig, wrong for your retirement.

## Roadmap

The mask has plans.

- [ ] Publish builds
- [ ] Create a wallet from user-provided private keys
- [ ] Manage more than one wallet at once
- [ ] Persistent key storage
- [ ] Authentication
- [ ] Create random wallets from a mnemonic and use specific/addressable addresses
- [ ] Decode proposed transactions using ABIs
- [ ] Friendlier monitoring
- [ ] Auto-sign mode
- [ ] Control over gas

---

<p align="center">
  Made with mischief by the team at <a href="https://voteagora.com"><strong>Agora</strong></a> · MIT Licensed<br/>
  <em>Remember, remember.</em>
</p>
