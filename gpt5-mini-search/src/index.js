/**
 * GPT-5 Mini with Web Search - Main Application
 * Complete implementation with free APIs and web search capabilities
 */

import readline from 'readline';
import { validateConfig } from './config/settings.js';
import { searchWeb, extractPageContent } from './services/webSearch.js';
import { queryGPT5Mini } from './services/gpt5Mini.js';
import { ContextManager } from './services/contextManager.js';
import logger, { withErrorHandling, withRetry } from './utils/errorHandler.js';
import config from './config/settings.js';

// Initialize context manager
const contextManager = new ContextManager();

/**
 * Process user query with web search
 * @param {string} userQuery 
 */
async function processQuery(userQuery) {
  logger.info(`Processing query: ${userQuery}`);
  
  try {
    // Step 1: Search the web
    logger.info('Searching the web...');
    const searchResults = await withRetry(() => searchWeb(userQuery));
    
    // Step 2: Extract full content from top results (optional)
    if (searchResults.length > 0) {
      logger.info(`Found ${searchResults.length} results, extracting content from top result...`);
      const topResult = searchResults[0];
      const fullContent = await extractPageContent(topResult.url);
      if (fullContent) {
        topResult.content = fullContent;
      }
    }
    
    // Step 3: Add user query to context
    contextManager.addMessage('user', userQuery);
    
    // Step 4: Query GPT-5 mini with search context
    logger.info('Querying GPT-5 mini...');
    const response = await withRetry(() => 
      queryGPT5Mini(userQuery, searchResults)
    );
    
    // Step 5: Add response to context
    contextManager.addMessage('assistant', response);
    
    // Step 6: Display response with sources
    displayResponse(response, searchResults);
    
  } catch (error) {
    logger.error('Failed to process query:', error);
    console.error('\n❌ Error:', error.message);
    
    // Provide helpful suggestions based on error type
    if (error.message.includes('Rate limit')) {
      console.log('💡 Tip: GitHub Copilot free tier has 50 requests/month. Check your usage or add an OpenAI API key with sufficient quota.');
    } else if (error.message.includes('Quota') || error.message.includes('insufficient_quota')) {
      console.log('💡 Tip: Your OpenAI account has exceeded its quota.');
      console.log('   - Check your billing at: https://platform.openai.com/account/billing/overview');
      console.log('   - Ensure you have a valid payment method');
      console.log('   - Wait for quota reset or upgrade your plan');
    } else if (error.message.includes('Personal Access Token')) {
      console.log('💡 Tip: GitHub Personal Access Tokens are not supported for Copilot.');
      console.log('   - Get a proper GitHub Copilot token from: https://github.com/settings/tokens');
      console.log('   - Or remove GITHUB_TOKEN and use only OpenAI API');
    } else if (error.message.includes('Authentication') || error.message.includes('401')) {
      console.log('💡 Tip: Check your API key is correct and not expired.');
      console.log('   - Verify OPENAI_API_KEY in .env file');
      console.log('   - Try regenerating your API key at: https://platform.openai.com/api-keys');
    }
  }
}

/**
 * Display response with sources
 * @param {string} response 
 * @param {Array} sources 
 */
function displayResponse(response, sources) {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 GPT-5 Mini Response:');
  console.log('='.repeat(60));
  console.log(response);
  
  if (sources && sources.length > 0) {
    console.log('\n' + '-' .repeat(60));
    console.log('📚 Sources:');
    sources.forEach((source, i) => {
      console.log(`${i + 1}. ${source.title}`);
      console.log(`   ${source.url}`);
    });
  }
  console.log('='.repeat(60) + '\n');
}

/**
 * Main CLI loop
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 GPT-5 Mini with Web Search');
  console.log('='.repeat(60));
  console.log('📝 Type your questions (or "exit" to quit)');
  console.log('🔍 Web search is automatically enabled for each query');
  console.log('💰 Using free tier: GitHub Copilot (50 requests/month)\n');
  
  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error('❌ Configuration Error:');
    console.error(error.message);
    console.log('\n📋 Please check your .env file and try again.');
    console.log('   Copy .env.example to .env and add your API keys.\n');
    process.exit(1);
  }
  
  // Show rate limit status
  console.log(`📊 Rate limit: ${config.rateLimit.requests} requests per ${config.rateLimit.window} days\n`);
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '💭 You: '
  });
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
    }
    
    if (input) {
      await processQuery(input);
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  });
}

// Handle errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});

// Start the application
main();