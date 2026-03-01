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
    // Prefer DuckDuckGo (free) when enabled; otherwise try Brave Search
    if (config.search.duckduckgoEnabled) {
      const results = await duckDuckGoSearch(query);
      if (results && results.length > 0) {
        return results;
      }
      // If DuckDuckGo returned nothing, still attempt Brave if configured
    }

    if (config.search.braveApiKey) {
      const results = await braveSearch(query);
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
      // Try to include API-provided error details when possible
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch (e) {
        bodyText = String(response.status);
      }

      if (response.status === 422) {
        throw new Error(`Brave Search API error: 422 (likely invalid or missing BRAVE_SEARCH_API_KEY). Response: ${bodyText}`);
      }

      throw new Error(`Brave Search API error: ${response.status}. Response: ${bodyText}`);
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
    // Use DuckDuckGo's free JSON API for safer, simpler results
    const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&skip_disambig=1`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout for DuckDuckGo
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    // Check if response has content
    const responseText = await response.text();
    if (!responseText || responseText.trim().length === 0) {
      logger.debug('DuckDuckGo returned empty response');
      return [];
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.warn('DuckDuckGo response is not valid JSON, trying alternative search method');
      return [];
    }
    const results = [];

    // Prefer the abstract if available
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        content: null
      });
    }

    // Parse RelatedTopics for more items
    const topics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
    for (const t of topics) {
      if (results.length >= config.search.maxResults) break;

      if (t.Text && t.FirstURL) {
        results.push({
          title: t.Result ? cheerio.load(t.Result)('a').text().trim() || t.Text : t.Text,
          url: t.FirstURL,
          snippet: t.Text,
          content: null
        });
      } else if (t.Topics && Array.isArray(t.Topics)) {
        for (const s of t.Topics) {
          if (results.length >= config.search.maxResults) break;
          if (s.Text && s.FirstURL) {
            results.push({
              title: s.Text,
              url: s.FirstURL,
              snippet: s.Text,
              content: null
            });
          }
        }
      }
    }

    // Limit to configured max results
    return results.slice(0, config.search.maxResults);
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