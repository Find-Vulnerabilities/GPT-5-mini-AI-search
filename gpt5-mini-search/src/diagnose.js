#!/usr/bin/env node

/**
 * Diagnostic tool to help identify configuration and API issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n' + '='.repeat(70));
console.log('🔍 GPT-5 Mini Search Configuration Diagnostic');
console.log('='.repeat(70) + '\n');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check 1: Environment variables
console.log('📋 1. Checking Environment Variables...');
console.log('-'.repeat(70));

const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasGitHubToken = !!process.env.GITHUB_TOKEN;
const hasDuckDuckGo = process.env.DUCKDUCKGO_SEARCH_ENABLED === 'true';
const hasBraveKey = !!process.env.BRAVE_SEARCH_API_KEY;

console.log(`✓ OPENAI_API_KEY configured: ${hasOpenAIKey ? '✅' : '❌'} ${hasOpenAIKey ? '(found)' : '(missing)'}`);
console.log(`✓ GITHUB_TOKEN configured: ${hasGitHubToken ? '✅' : '❌'} ${hasGitHubToken ? '(found)' : '(missing)'}`);
console.log(`✓ DUCKDUCKGO_SEARCH_ENABLED: ${hasDuckDuckGo ? '✅' : '❌'} (${process.env.DUCKDUCKGO_SEARCH_ENABLED})`);
console.log(`✓ BRAVE_SEARCH_API_KEY configured: ${hasBraveKey ? '✅' : '❌'} ${hasBraveKey ? '(found)' : '(missing)'}`);

if (!hasOpenAIKey && !hasGitHubToken && !hasBraveKey && !hasDuckDuckGo) {
  console.log('\\n⚠️  No API keys configured! Please set at least one authentication method.');
}

console.log('\\n');

// Check 2: Required files
console.log('📂 2. Checking Required Files...');
console.log('-'.repeat(70));

const requiredFiles = [
  'src/index.js',
  'src/config/settings.js',
  'src/services/gpt5Mini.js',
  'src/services/webSearch.js',
  'src/services/contextManager.js',
  'package.json',
  '.env'
];

for (const file of requiredFiles) {
  const fullPath = path.resolve(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  console.log(`✓ ${file}: ${exists ? '✅' : '❌'}`);
}

console.log('\\n');

// Check 3: API Key validation
console.log('🔑 3. API Key Validation...');
console.log('-'.repeat(70));

if (hasOpenAIKey) {
  const keyFormat = /^sk-/.test(process.env.OPENAI_API_KEY);
  console.log(`✓ OpenAI API Key format: ${keyFormat ? '✅ Valid format' : '❌ Invalid format (should start with sk-)'}`);
  console.log(`  Length: ${process.env.OPENAI_API_KEY.length} characters`);
}

if (hasGitHubToken) {
  const isPersonalToken = /^ghp_/.test(process.env.GITHUB_TOKEN);
  console.log(`✓ GitHub Token type: ${isPersonalToken ? '⚠️  Personal Access Token (NOT recommended for Copilot)' : '✅ Other type (may be Copilot token)'}`);
  if (isPersonalToken) {
    console.log('  ⚠️  ERROR: Personal Access Tokens are not supported by GitHub Copilot API');
    console.log('  ACTION: Request Copilot access at https://github.com/github-copilot/signups');
  }
}

console.log('\\n');

// Check 4: Recommendations
console.log('💡 4. Recommendations...');
console.log('-'.repeat(70));

if (!hasOpenAIKey && !hasGitHubToken) {
  console.log('❌ You need at least one AI API. Choose one:');
  console.log('   1. Get OpenAI API Key: https://platform.openai.com/api-keys');
  console.log('   2. Get GitHub Copilot Token: https://github.com/github-copilot/signups');
}

if (hasOpenAIKey) {
  console.log('✓ Using OpenAI API');
  console.log('  - Check quota: https://platform.openai.com/account/billing/overview');
  console.log('  - Verify payment method is active');
  console.log('  - Current model: gpt-3.5-turbo');
}

if (hasGitHubToken) {
  console.log('✓ Using GitHub Copilot');
  if (/^ghp_/.test(process.env.GITHUB_TOKEN)) {
    console.log('  ⚠️  WARNING: Personal Access Token detected. This will NOT work!');
    console.log('  ACTION: Get a Copilot-specific token from https://github.com/github-copilot/signups');
  } else {
    console.log('  - Free tier: 50 requests per month');
  }
}

if (hasDuckDuckGo) {
  console.log('✓ DuckDuckGo search enabled (free, no limits)');
}

if (hasBraveKey) {
  console.log('✓ Brave Search API configured');
  console.log('  - Free tier: 2000 requests per month');
}

console.log('\\n' + '='.repeat(70));
console.log('✨ Configuration check complete!');
console.log('='.repeat(70) + '\\n');
