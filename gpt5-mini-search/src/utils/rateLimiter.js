/**
 * Rate limiting utility for API requests
 */

/**
 * Rate limiter class
 */
export class RateLimiter {
  /**
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} timeWindow - Time window in milliseconds
   */
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  /**
   * Try to make a request
   * @returns {boolean} True if request is allowed
   */
  tryRequest() {
    const now = Date.now();
    
    // Remove old requests
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.timeWindow
    );
    
    // Check if under limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get remaining requests
   * @returns {number}
   */
  getRemainingRequests() {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => 
      now - timestamp < this.timeWindow
    );
    return Math.max(0, this.maxRequests - this.requests.length);
  }
  
  /**
   * Get time until reset in milliseconds
   * @returns {number}
   */
  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + this.timeWindow;
    return Math.max(0, resetTime - Date.now());
  }
}