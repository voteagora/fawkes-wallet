import express from 'express';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { getSdkError, buildApprovedNamespaces } from '@walletconnect/utils';
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

let impersonatedSigner = null;
let impersonatedAddress = null;

let walletAddress = null;

let activeSession = null;
let pendingRequests = new Map();
let walletHistory = [];
let provider = null;

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

        console.log('WalletKit instance created:', walletKit);

        walletKit.on('session_proposal', async (event) => {
            console.log('DEBUG: session_proposal event triggered');
            console.log('Event details:', JSON.stringify(event, null, 2));
            walletHistory.push({
                type: 'session_proposal',
                emoji: '🙏',
                timestamp: new Date(),
                context: {
                event
                }
            });
            pendingRequests.set('session_proposal', event);
        });

        walletKit.on('session_request', async (event) => {
            console.log('DEBUG: session_request event triggered');
            console.log('Event details:', JSON.stringify(event, null, 2));
            walletHistory.push({
                type: 'session_request',
                timestamp: new Date(),
                context: { event } 
            });
            pendingRequests.set(event.id, event);
        });

        walletKit.on('error', (error) => {
            console.error('WalletKit error:', error);
        });

        walletKit.on('session_delete', (event) => {
            console.log('DEBUG: session_delete event:', event);
            walletHistory.push({
                type: 'session_delete',
                timestamp: new Date(),
                context: { event } 
            });
            activeSession = null;
        });

        console.log('WalletKit event handlers registered');

        console.log('WalletConnect initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        throw error;
    }
}

// Initialize WalletConnect immediately on server start
initializeWalletConnect().catch(error => {
    console.error('Failed to initialize WalletKit on startup:', error);
    process.exit(1);
});

// API Routes
app.post('/wallet/create', async (req, res) => {

    impersonatedAddress = req.body.address;

    console.log(`impersonatedAddress: ${impersonatedAddress}`);

    let resp = {};

    if (impersonatedAddress) {
        
        console.log("A");
        provider = new ethers.JsonRpcProvider("http://localhost:8111");

        await provider.send("anvil_impersonateAccount", [impersonatedAddress]);

        // impersonatedSigner = new ethers.Wallet(impersonatedAddress, provider);


        walletAddress = impersonatedAddress;

        // walletKit.setSigner(impersonatedSigner);

        walletHistory.push({
            type: 'wallet_created',
            emoji: '⭐️',
            timestamp: new Date(),
            context: { 
                impersonated: true,
                address: walletAddress
            }
        });

        resp = { 
            address: walletAddress,
            impersonated: "true"
        };

        console.log(`RESP: ${resp}`);
    } else {
        const mnemonic = req.body.mnemonic || bip39.generateMnemonic();
        wallet = ethers.Wallet.fromPhrase(mnemonic);    

        walletAddress = wallet.address;

        walletHistory.push({
            type: 'wallet_created',
            emoji: '⭐️',
            context: { 
                timestamp: new Date(),
                mnemonic,
                address: walletAddress
            }
        });

        resp = { 
            address: walletAddress,
            mnemonic: mnemonic
        };
    }


    res.json(resp);
});

app.post('/wallet/connect', async (req, res) => {
    try {
        if (!wallet && !impersonatedAddress) {
            return res.status(400).json({ error: 'Wallet not initialized' });
        }
        const { uri } = req.body;
        if (!uri) {
            return res.status(400).json({ error: 'WalletConnect URI is required' });
        }

        console.log('Attempting to pair with URI:', uri);
        const connection = await walletKit.pair({ uri });
        console.log('Pairing response:', connection);
        
        walletHistory.push({
            type: 'pairing_attempt',
            emoji: '👋',
            timestamp: new Date(),
            context: {
                success: true,
                connection    
            }
        });
        
        res.json({ success: true, connection });
    } catch (error) {
        console.error('Connection error:', error);
        walletHistory.push({
            type: 'pairing_attempt',
            timestamp: new Date(),
            emoji: '❌',
            context: {
                success: false,
                error: error.message
            }
        });
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/approve-session', async (req, res) => {
    try {
        console.log('DEBUG: approve-session event triggered');
        const proposal = pendingRequests.get('session_proposal');
        console.log(proposal)
        if (!proposal) {
            return res.status(404).json({ error: 'No pending session proposal' });
        }

        console.log('DEBUG: Validating session proposal');
        const { id, params } = proposal;
        const { requiredNamespaces, optionalNamespaces, relays } = params;
        console.log('DEBUG: Session proposal details:', JSON.stringify(params, null, 2));

        console.log('DEBUG: Optional namespaces:', JSON.stringify(optionalNamespaces, null, 2));
        console.log('DEBUG: Required namespaces:', JSON.stringify(requiredNamespaces, null, 2));
        console.log('DEBUG: Relays:', JSON.stringify(relays, null, 2));

        // Build supported namespaces based on required namespaces
        const supportedNamespaces = {};
        Object.entries(optionalNamespaces).forEach(([chain, namespace]) => {
            supportedNamespaces[chain] = {
                chains: namespace.chains,
                methods: namespace.methods,
                events: namespace.events,
                accounts: namespace.chains.map(chain => `${chain}:${walletAddress}`)
            };
        });

        console.log('DEBUG: Supported namespaces:', JSON.stringify(supportedNamespaces, null, 2));

        const approvedNamespaces = buildApprovedNamespaces({
            proposal: params,
            supportedNamespaces
        });

        console.log('DEBUG: Approved namespaces:', JSON.stringify(approvedNamespaces, null, 2));

        const session = await walletKit.approveSession({
            id,
            relayProtocol: relays[0].protocol,
            namespaces: approvedNamespaces
        });

        activeSession = session;
        pendingRequests.delete('session_proposal');

        walletHistory.push({
            type: 'session_approved',
            emoji: '🟢',
            timestamp: new Date(),
            context: {
                session
            }
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
            emoji: '🛑',
            timestamp: new Date(),
            context : {
                proposal
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/wallet/approve-request', async (req, res) => {
    try {
        let { requestId } = req.body;
        if (!requestId) {
            const lastRequest = Array.from(pendingRequests).pop();
            if (!lastRequest) {
                return res.status(404).json({ error: 'No pending requests' });
            }
            requestId = lastRequest[1].id; 
        }

        const request = pendingRequests.get(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        let result;
        const { topic, params } = request;
        const { request: methodRequest } = params;

        console.log(`DEBUG: ${methodRequest.method}`)

        if (methodRequest.method === 'personal_sign') {
            const message = methodRequest.params[0];

            if (wallet) {
                result = await wallet.signMessage(ethers.getBytes(message));
            } else {
                result = await impersonatedSigner.signMessage(ethers.getBytes(message));
            }

        } else if (methodRequest.method === 'eth_signTransaction') {
            console.log(`DEBUG: ${methodRequest.params[0]}`)
            throw new Error("eth_signTransaction not implemented!")

        } else if (methodRequest.method == 'eth_sendTransaction') {
            const tx = methodRequest.params[0];
            console.log(`DEBUG: ${tx}`)
            if (wallet) {
                result = await wallet.sendTransaction(tx);
            } else {
                result = await provider.send("eth_sendTransaction", [tx]);
                // result = await impersonatedSigner.sendTransaction(tx);
            }
        }

        console.log(`DEBUG: ${result}`)

        await walletKit.respondSessionRequest({
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
            emoji: '✅',
            timestamp: new Date(),
            context: { request, result }
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

        await walletKit.respondSessionRequest({
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
            emoji: '❌',
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
        initialized: !!walletAddress,
        address: walletAddress,
        connected: !!activeSession,
        pendingRequests: Array.from(pendingRequests.entries()),
        history: walletHistory
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
