/**
 * GPT-5 mini model integration
 * Supports both official OpenAI API and GitHub Copilot (free)
 */

import fetch from 'node-fetch';
import config from '../config/settings.js';
import logger from '../utils/errorHandler.js';
import { RateLimiter } from '../utils/rateLimiter.js';

const rateLimiter = new RateLimiter(
  config.rateLimit.requests,
  config.rateLimit.window * 24 * 60 * 60 * 1000 // Convert days to ms
);

/**
 * Send a prompt to GPT-5 mini with context
 * @param {string} prompt - User prompt
 * @param {Array} searchResults - Search results to include as context
 * @returns {Promise<string>} Model response
 */
export async function queryGPT5Mini(prompt, searchResults = []) {
  // Check rate limit
  if (!rateLimiter.tryRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Build context from search results
  const context = buildContext(searchResults);
  
  // Construct the full prompt with context
  const fullPrompt = constructPrompt(prompt, context);
  
  try {
    // Try GitHub Copilot first (free)
    if (config.github.token) {
      try {
        const response = await queryGitHubCopilot(fullPrompt);
        return response;
      } catch (githubError) {
        logger.warn('GitHub Copilot failed, falling back to OpenAI:', githubError);
      }
    }
    
    // Fallback to OpenAI API
    if (config.openai.apiKey) {
      return await queryOpenAI(fullPrompt);
    }
    
    throw new Error('No working API method available');
  } catch (error) {
    logger.error('GPT-5 mini query failed:', error);
    throw error;
  }
}

/**
 * Query GitHub Copilot (free tier: 50 requests/month)
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function queryGitHubCopilot(prompt) {
  const response = await fetch(config.github.copilotEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.github.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini', // GitHub Copilot model mapping
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant with access to real-time web search results. Use the provided context to answer questions accurately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub Copilot error (${response.status}): ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Query OpenAI API
 * @param {string} prompt 
 * @returns {Promise<string>}
 */
async function queryOpenAI(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini', // Actual model name may vary
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant with access to real-time web search results. Use the provided context to answer questions accurately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Build context string from search results
 * @param {Array} results 
 * @returns {string}
 */
function buildContext(results) {
  if (!results || results.length === 0) {
    return '';
  }
  
  let context = 'Here is information from web search results:\n\n';
  
  results.forEach((result, index) => {
    context += `[${index + 1}] ${result.title}\n`;
    context += `URL: ${result.url}\n`;
    context += `Summary: ${result.snippet}\n`;
    if (result.content) {
      context += `Full content: ${result.content.substring(0, 500)}...\n`;
    }
    context += '\n';
  });
  
  context += 'Please use this information to answer the user\'s question. ' +
             'If the search results don\'t contain relevant information, ' +
             'acknowledge that and use your general knowledge.\n\n';
  
  return context;
}

/**
 * Construct the full prompt
 * @param {string} userPrompt 
 * @param {string} context 
 * @returns {string}
 */
function constructPrompt(userPrompt, context) {
  return `${context}User question: ${userPrompt}`;
}