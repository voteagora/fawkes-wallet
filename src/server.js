import express from 'express';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { getSdkError } from '@walletconnect/utils';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Verify environment variables
if (!process.env.WALLET_CONNECT_PROJECT_ID) {
    console.error('Error: WALLET_CONNECT_PROJECT_ID is required in .env file');
    process.exit(1);
}

// In-memory state
let wallet = null;
let walletKit = null;
let activeSession = null;
let pendingRequests = new Map();
let walletHistory = [];

// Initialize WalletConnect
async function initializeWalletConnect() {
    try {
        const core = new Core({
            projectId: process.env.WALLET_CONNECT_PROJECT_ID
        });

        walletKit = await WalletKit.init({
            core,
            metadata: {
                name: 'REST Wallet',
                description: 'A REST API-controlled Ethereum wallet',
                url: 'http://localhost:' + (process.env.PORT || 3000),
                icons: ['https://walletconnect.org/walletconnect-logo.png']
            }
        });

        walletKit.on('session_proposal', async (event) => {
            console.log('Received session proposal:', event);
            walletHistory.push({
                type: 'session_proposal',
                timestamp: new Date(),
                data: event
            });
            pendingRequests.set('session_proposal', event);
        });

        walletKit.on('session_request', async (event) => {
            console.log('Received session request:', event);
            walletHistory.push({
                type: 'session_request',
                timestamp: new Date(),
                data: event
            });
            pendingRequests.set(event.id, event);
        });

        console.log('WalletConnect initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        throw error;
    }
}

// API Routes
app.post('/wallet/create', async (req, res) => {
    try {
        const mnemonic = req.body.mnemonic || bip39.generateMnemonic();
        wallet = ethers.Wallet.fromPhrase(mnemonic);
        walletHistory.push({
            type: 'wallet_created',
            timestamp: new Date(),
            address: wallet.address
        });
        res.json({
            address: wallet.address,
            mnemonic: mnemonic
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/connect', async (req, res) => {
    try {
        if (!walletKit) {
            await initializeWalletConnect();
        }
        if (!wallet) {
            return res.status(400).json({ error: 'Wallet not initialized' });
        }
        const { uri } = req.body;
        if (!uri) {
            return res.status(400).json({ error: 'WalletConnect URI is required' });
        }

        const connection = await walletKit.pair({ uri });
        console.log('Paired with dApp:', connection.app.metadata.name);
        res.json({ success: true });
    } catch (error) {
        console.error('Connection error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/approve-session', async (req, res) => {
    try {
        const proposal = pendingRequests.get('session_proposal');
        if (!proposal) {
            return res.status(404).json({ error: 'No pending session proposal' });
        }

        const { id, params } = proposal;
        const { requiredNamespaces, relays } = params;

        const namespaces = {};
        Object.keys(requiredNamespaces).forEach(key => {
            const chains = requiredNamespaces[key].chains || [];
            namespaces[key] = {
                accounts: chains.map(chain => `${chain}:${wallet.address}`),
                methods: requiredNamespaces[key].methods,
                events: requiredNamespaces[key].events
            };
        });

        const session = await walletKit.approveSession({
            id,
            relayProtocol: relays[0].protocol,
            namespaces
        });

        activeSession = session;
        pendingRequests.delete('session_proposal');
        walletHistory.push({
            type: 'session_approved',
            timestamp: new Date(),
            data: session
        });

        res.json({ success: true, session });
    } catch (error) {
        console.error('Session approval error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/reject-session', async (req, res) => {
    try {
        const proposal = pendingRequests.get('session_proposal');
        if (!proposal) {
            return res.status(404).json({ error: 'No pending session proposal' });
        }

        await walletKit.reject({
            id: proposal.id,
            reason: getSdkError('USER_REJECTED')
        });

        pendingRequests.delete('session_proposal');
        walletHistory.push({
            type: 'session_rejected',
            timestamp: new Date(),
            data: proposal
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/approve-request', async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = pendingRequests.get(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        let result;
        const { topic, params } = request;
        const { request: methodRequest } = params;

        if (methodRequest.method === 'personal_sign') {
            const message = methodRequest.params[0];
            result = await wallet.signMessage(ethers.getBytes(message));
        } else if (methodRequest.method === 'eth_signTransaction') {
            const tx = methodRequest.params[0];
            result = await wallet.signTransaction(tx);
        }

        await walletKit.respond({
            topic,
            response: {
                id: request.id,
                jsonrpc: '2.0',
                result
            }
        });

        pendingRequests.delete(requestId);
        walletHistory.push({
            type: 'request_approved',
            timestamp: new Date(),
            data: { request, result }
        });

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/reject-request', async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = pendingRequests.get(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        await walletKit.respond({
            topic: request.topic,
            response: {
                id: request.id,
                jsonrpc: '2.0',
                error: getSdkError('USER_REJECTED')
            }
        });

        pendingRequests.delete(requestId);
        walletHistory.push({
            type: 'request_rejected',
            timestamp: new Date(),
            data: request
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/wallet/status', (req, res) => {
    res.json({
        initialized: !!wallet,
        address: wallet?.address,
        connected: !!activeSession,
        pendingRequests: Array.from(pendingRequests.entries()),
        history: walletHistory
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
