#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3000}`;

// Utility function to format JSON output
const formatOutput = (data, raw = false) => {
  if (raw) {
    console.log(JSON.stringify(data));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Utility function for making API requests
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
};

program
  .name('wallet-cli')
  .description('CLI interface for the Ethereum wallet API')
  .version('1.0.0')
  .option('--raw', 'Output raw JSON without formatting');

// Create wallet command
program
  .command('create')
  .description('Create a new wallet')
  .option('-m, --mnemonic <phrase>', 'Optional mnemonic phrase')
  .option('-a, --address <address>', 'Optional address to impersonate')
  .action(async (options) => {
    try {
      const payload = {};
      if (options.mnemonic) payload.mnemonic = options.mnemonic;
      if (options.address) payload.address = options.address;
      
      const data = await apiRequest('/wallet/create', 'POST', payload);
      console.log(chalk.green('Wallet created successfully:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to create wallet: ${error.message}`));
    }
  });

// Connect wallet command
program
  .command('connect')
  .description('Connect to a dApp using WalletConnect')
  .requiredOption('-u, --uri <uri>', 'WalletConnect URI')
  .action(async (options) => {
    try {
      const data = await apiRequest('/wallet/connect', 'POST', { uri: options.uri });
      console.log(chalk.green('Connection initiated:'));
      formatOutput(data, program.opts().raw);

      

      const data2 = await apiRequest('/wallet/approve-session', 'POST');
      console.log(chalk.green('Session approved:'));
      formatOutput(data2, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to connect: ${error.message}`));
    }
  });

// Session management commands
program
  .command('approve-session')
  .description('Approve an incoming session request')
  .action(async () => {
    try {
      const data = await apiRequest('/wallet/approve-session', 'POST');
      console.log(chalk.green('Session approved:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to approve session: ${error.message}`));
    }
  });

program
  .command('reject-session')
  .description('Reject an incoming session request')
  .action(async () => {
    try {
      const data = await apiRequest('/wallet/reject-session', 'POST');
      console.log(chalk.green('Session rejected:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to reject session: ${error.message}`));
    }
  });

// Transaction request management
program
  .command('approve-request')
  .description('Approve a transaction request')
  .option('-i, --id <requestId>', 'Request ID to approve (optional, uses latest if not specified)')
  .action(async (options) => {
    try {
      const data = await apiRequest('/wallet/approve-request', 'POST', 
        options.id ? { requestId: options.id } : {});
      console.log(chalk.green('Request approved:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to approve request: ${error.message}`));
    }
  });

program
  .command('reject-request')
  .description('Reject a transaction request')
  .option('-i, --id <requestId>', 'Request ID to reject (optional, uses latest if not specified)')
  .action(async (options) => {
    try {
      const data = await apiRequest('/wallet/reject-request', 'POST',
        options.id ? { requestId: options.id } : {});
      console.log(chalk.green('Request rejected:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to reject request: ${error.message}`));
    }
  });

// Status command
program
  .command('status')
  .description('Get wallet status')
  .action(async () => {
    try {
      const data = await apiRequest('/wallet/status');
      console.log(chalk.blue('Wallet Status:'));
      formatOutput(data, program.opts().raw);
    } catch (error) {
      console.error(chalk.red(`Failed to get status: ${error.message}`));
    }
  });

program.parse();
