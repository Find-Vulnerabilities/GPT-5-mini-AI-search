/**
 * Context window manager for GPT-5 mini
 * Handles token counting and context optimization
 */

import logger from '../utils/errorHandler.js';

// Rough estimation: 1 token ≈ 4 characters for English
const TOKEN_CHAR_RATIO = 4;
const MAX_CONTEXT_TOKENS = 128000; // GPT-5 context window size

/**
 * Context window manager class
 */
export class ContextManager {
  constructor(maxTokens = MAX_CONTEXT_TOKENS) {
    this.maxTokens = maxTokens;
    this.conversationHistory = [];
  }
  
  /**
   * Add message to conversation history
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content 
   */
  addMessage(role, content) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    this.optimizeContext();
  }
  
  /**
   * Get conversation history
   * @returns {Array}
   */
  getHistory() {
    return this.conversationHistory;
  }
  
  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
  
  /**
   * Optimize context to fit within token limit
   * Removes oldest messages first
   */
  optimizeContext() {
    let totalTokens = this.estimateTokens(JSON.stringify(this.conversationHistory));
    
    while (totalTokens > this.maxTokens && this.conversationHistory.length > 1) {
      const removed = this.conversationHistory.shift();
      logger.debug(`Removed old message to free context space: ${removed.role}`);
      totalTokens = this.estimateTokens(JSON.stringify(this.conversationHistory));
    }
    
    if (this.conversationHistory.length === 1 && totalTokens > this.maxTokens) {
      // Single message too large, truncate it
      const lastMessage = this.conversationHistory[0];
      const maxChars = this.maxTokens * TOKEN_CHAR_RATIO;
      lastMessage.content = lastMessage.content.substring(0, maxChars);
      logger.warn('Truncated last message to fit context window');
    }
  }
  
  /**
   * Estimate token count from text
   * @param {string} text 
   * @returns {number}
   */
  estimateTokens(text) {
    if (!text) return 0;
    // Rough estimation: tokens ≈ characters / 4
    return Math.ceil(text.length / TOKEN_CHAR_RATIO);
  }
  
  /**
   * Prepare messages for API call
   * @param {string} systemPrompt 
   * @param {Array} searchResults 
   * @returns {Array} Formatted messages
   */
  prepareMessages(systemPrompt, searchResults = []) {
    const messages = [];
    
    // Add system prompt
    messages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // Add search results as context if available
    if (searchResults.length > 0) {
      const searchContext = this.formatSearchResults(searchResults);
      messages.push({
        role: 'system',
        content: `Web search context:\n${searchContext}`
      });
    }
    
    // Add conversation history
    messages.push(...this.conversationHistory);
    
    return messages;
  }
  
  /**
   * Format search results for context
   * @param {Array} results 
   * @returns {string}
   */
  formatSearchResults(results) {
    return results.map((r, i) => 
      `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`
    ).join('\n\n');
  }
}