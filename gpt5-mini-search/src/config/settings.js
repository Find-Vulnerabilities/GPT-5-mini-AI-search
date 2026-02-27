/**
 * Configuration management module
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Application configuration object
 * @typedef {Object} Config
 * @property {Object} openai - OpenAI API configuration
 * @property {string} openai.apiKey - OpenAI API key
 * @property {string} openai.model - Model name (gpt-5-mini)
 * @property {Object} github - GitHub Copilot configuration
 * @property {string} github.token - GitHub token for Copilot
 * @property {Object} search - Search API configuration
 * @property {string} search.braveApiKey - Brave Search API key
 * @property {boolean} search.duckduckgoEnabled - Use DuckDuckGo search
 * @property {number} search.maxResults - Maximum search results to return
 * @property {number} search.cacheTTL - Cache TTL in seconds
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {number} rateLimit.requests - Max requests per window
 * @property {number} rateLimit.window - Time window in days
 */

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-5-mini', // Note: Actual model name may vary
  },
  github: {
    token: process.env.GITHUB_TOKEN,
    copilotEndpoint: 'https://api.githubcopilot.com/chat/completions',
  },
  search: {
    braveApiKey: process.env.BRAVE_SEARCH_API_KEY,
    duckduckgoEnabled: process.env.DUCKDUCKGO_SEARCH_ENABLED === 'true',
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS) || 5,
    cacheTTL: parseInt(process.env.CACHE_TTL) || 3600,
  },
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS) || 50,
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 30, // days
  },
};

/**
 * Validates required configuration
 * @throws {Error} If required configuration is missing
 */
export function validateConfig() {
  const errors = [];
  
  // Check if at least one search method is configured
  if (!config.search.braveApiKey && !config.search.duckduckgoEnabled) {
    errors.push('No search method configured. Set BRAVE_SEARCH_API_KEY or DUCKDUCKGO_SEARCH_ENABLED=true');
  }
  
  // Check if either OpenAI API key or GitHub token is provided
  if (!config.openai.apiKey && !config.github.token) {
    errors.push('No authentication method configured. Set OPENAI_API_KEY or GITHUB_TOKEN');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

export default config;
// Also provide a named export for environments or consumers that import { config }
export { config };