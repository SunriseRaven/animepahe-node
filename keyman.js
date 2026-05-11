#!/usr/bin/env node
/**
 * keyman.js — AnimePahe API Key Manager
 *
 * Usage (from Termux):
 *   node keyman.js generate [label]
 *   node keyman.js list
 *   node keyman.js revoke <key>
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const KEYS_FILE = path.join(__dirname, 'config/api_keys.json');

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) return [];
  return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function generateKey(label = 'default') {
  const token = `${label}_${crypto.randomBytes(16).toString('hex')}`;
  const keys  = loadKeys();

  if (keys.includes(token)) {
    console.log('Key already exists (collision — try again).');
    return;
  }

  keys.push(token);
  saveKeys(keys);

  console.log(`\n✅ API Key generated:`);
  console.log(`   Label : ${label}`);
  console.log(`   Key   : ${token}`);
  console.log(`\nUse in requests:`);
  console.log(`   Header : X-API-Key: ${token}`);
  console.log(`   Param  : ?api_key=${token}\n`);
}

function listKeys() {
  const keys = loadKeys();
  if (keys.length === 0) {
    console.log('No API keys registered yet.');
    return;
  }
  console.log(`\nRegistered API keys (${keys.length}):`);
  keys.forEach((k, i) => console.log(`  [${i + 1}] ${k}`));
  console.log('');
}

function revokeKey(key) {
  const keys     = loadKeys();
  const filtered = keys.filter(k => k !== key);

  if (filtered.length === keys.length) {
    console.log('Key not found.');
    return;
  }

  saveKeys(filtered);
  console.log(`\n✅ Key revoked: ${key}\n`);
}

function printHelp() {
  console.log(`
AnimePahe API — Key Manager
============================
  node keyman.js generate [label]   Generate a new API key
  node keyman.js list               List all registered API keys
  node keyman.js revoke <key>       Revoke an existing API key

Examples:
  node keyman.js generate julius_local
  node keyman.js generate talaklase_app
  node keyman.js list
  node keyman.js revoke julius_local_abc123def456...
`);
}

const [,, cmd, arg] = process.argv;

switch (cmd) {
  case 'generate': generateKey(arg || 'default'); break;
  case 'list':     listKeys();                    break;
  case 'revoke':
    if (!arg) { console.log('Usage: node keyman.js revoke <key>'); process.exit(1); }
    revokeKey(arg);
    break;
  default: printHelp(); break;
}
