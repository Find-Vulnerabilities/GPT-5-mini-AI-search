/**
 * Web search service implementation
 * Supports Brave Search API and DuckDuckGo (free)
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import config from '../config/settings.js';
import logger from '../utils/errorHandler.js';

/**
 * Search result item
 * @typedef {Object} SearchResult
 * @property {string} title - Result title
 * @property {string} url - Result URL
 * @property {string} snippet - Text snippet/description
 * @property {string} content - Full extracted content (optional)
 */

/**
 * Main search function that routes to appropriate provider
 * @param {string} query - Search query
 * @returns {Promise<Array<SearchResult>>} Search results
 */
export async function searchWeb(query) {
  logger.info(`Searching for: ${query}`);
  
  try {
    // Try Brave Search first if API key available
    if (config.search.braveApiKey) {
      const results = await braveSearch(query);
      if (results && results.length > 0) {
        return results;
      }
    }
    
    // Fallback to DuckDuckGo (free, no API key needed)
    if (config.search.duckduckgoEnabled) {
      const results = await duckDuckGoSearch(query);
      if (results && results.length > 0) {
        return results;
      }
    }
    
    logger.warn('No search results found');
    return [];
  } catch (error) {
    logger.error('Search failed:', error);
    return [];
  }
}

/**
 * Brave Search API implementation
 * @param {string} query 
 * @returns {Promise<Array<SearchResult>>}
 */
async function braveSearch(query) {
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${config.search.maxResults}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': config.search.braveApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.web?.results?.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      content: null // Full content not provided by API
    })) || [];
  } catch (error) {
    logger.error('Brave Search failed:', error);
    return [];
  }
}

/**
 * DuckDuckGo search implementation (scraping - free)
 * Note: Respect robots.txt and rate limits
 * @param {string} query 
 * @returns {Promise<Array<SearchResult>>}
 */
async function duckDuckGoSearch(query) {
  try {
    // Using DuckDuckGo's HTML endpoint
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPT5MiniBot/1.0; +https://yourdomain.com/bot)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];
    
    $('.result').each((i, element) => {
      if (i >= config.search.maxResults) return false;
      
      const titleElement = $(element).find('.result__a');
      const urlElement = $(element).find('.result__url');
      const snippetElement = $(element).find('.result__snippet');
      
      results.push({
        title: titleElement.text().trim(),
        url: urlElement.attr('href') || '',
        snippet: snippetElement.text().trim(),
        content: null
      });
    });
    
    return results;
  } catch (error) {
    logger.error('DuckDuckGo search failed:', error);
    return [];
  }
}

/**
 * Extract full content from a URL
 * @param {string} url 
 * @returns {Promise<string|null>}
 */
export async function extractPageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPT5MiniBot/1.0)'
      },
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script and style tags
    $('script, style, nav, footer, header').remove();
    
    // Get main content (prioritize article or main tags)
    const mainContent = $('article, main, .content, #content').text() || $('body').text();
    
    // Clean up whitespace
    return mainContent.replace(/\s+/g, ' ').trim().substring(0, 2000); // Limit to 2000 chars
  } catch (error) {
    logger.error(`Content extraction failed for ${url}:`, error);
    return null;
  }
}

// Named exports are declared inline with the function definitions above