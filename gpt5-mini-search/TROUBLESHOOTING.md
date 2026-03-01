# Troubleshooting Guide

## Common Issues & Solutions

### 1. **OpenAI API Error 429: Insufficient Quota**

**Problem:**
```
OpenAI API error (429): {
    "error": {
        "message": "You exceeded your current quota, please check your plan and billing details.",
        "type": "insufficient_quota"
    }
}
```

**Causes:**
- Your OpenAI account has reached its usage quota
- No valid payment method on the account
- Free trial credits have expired

**Solutions:**
1. Check your OpenAI account status:
   - Visit: https://platform.openai.com/account/billing/overview
   - Verify you have available credits or a valid payment method
   - Check your usage limits

2. Upgrade your plan if necessary:
   - Go to: https://platform.openai.com/account/billing/limits
   - Increase your Hard Limit if possible

3. Wait for quota reset (if on free tier)

4. Use GitHub Copilot instead:
   - Request access: https://github.com/github-copilot/signups
   - Free tier: 50 requests/month

---

### 2. **GitHub Copilot: Personal Access Token Error**

**Problem:**
```
GitHub Copilot authentication failed: 
Personal Access Tokens are not supported for this endpoint. 
Use a Copilot-specific token or OAuth flow.
```

**Cause:**
- The GITHUB_TOKEN in `.env` is a Personal Access Token (starts with `ghp_`)
- GitHub Copilot API requires a Copilot-specific token, not a PAT

**Solutions:**
1. Get a Copilot-specific token:
   - Request GitHub Copilot access: https://github.com/github-copilot/signups
   - This will provide you with a proper Copilot token

2. Or remove GitHub Copilot and use OpenAI only:
   - Comment out or remove `GITHUB_TOKEN` from `.env`
   - Ensure `OPENAI_API_KEY` is configured with quota available

---

### 3. **DuckDuckGo Search: Unexpected End of JSON Input**

**Problem:**
```
DuckDuckGo search failed: Unexpected end of JSON input
```

**Causes:**
- DuckDuckGo API returned an empty or invalid response
- Network connectivity issues
- Rate limiting from DuckDuckGo (too many requests)

**Solutions:**
1. Wait a moment and try again
2. Use Brave Search instead:
   - Get a free API key: https://api.search.brave.com
   - Add to `.env`: `BRAVE_SEARCH_API_KEY=your-key-here`

3. Reduce request frequency
4. Check your internet connection

---

### 4. **OpenAI API Error 401: Invalid API Key**

**Problem:**
```
OpenAI API error (401): Invalid API key
```

**Causes:**
- Incorrect API key in `.env`
- Expired or revoked API key
- Typo in the key

**Solutions:**
1. Verify your API key:
   - Go to: https://platform.openai.com/api-keys
   - Create a new key if needed
   - Copy the exact key to `.env`

2. Make sure the key hasn't been revoked
3. Check for typos or extra spaces in `.env`

---

### 5. **Model Not Found: gpt-5-mini**

**Problem:**
```
Error: The model 'gpt-5-mini' does not exist
```

**Cause:**
- The model name is incorrect (gpt-5-mini doesn't exist)

**Solution:**
- The code has been updated to use `gpt-3.5-turbo` (a real, working model)
- If you're getting this error, this file hasn't been updated properly
- Make sure you're running the latest version

---

## Running the Diagnostic Tool

To help identify configuration issues, run:

```bash
npm run diagnose
```

This will check:
- ✓ Environment variables are set
- ✓ Required files exist
- ✓ API key format is valid
- ✓ Provide recommendations

---

## Quick Configuration Checklist

- [ ] Chose one API method:
  - [ ] OpenAI (visit https://platform.openai.com/api-keys)
  - [ ] GitHub Copilot (visit https://github.com/github-copilot/signups)

- [ ] Set up `.env` file correctly:
  ```env
  OPENAI_API_KEY=sk-... (if using OpenAI)
  GITHUB_TOKEN=token... (if using Copilot)
  DUCKDUCKGO_SEARCH_ENABLED=true (or BRAVE_SEARCH_API_KEY)
  ```

- [ ] Verified API has quota/credits:
  - OpenAI: https://platform.openai.com/account/billing/overview
  - GitHub: 50 requests/month free

- [ ] Using correct model names:
  - OpenAI: `gpt-3.5-turbo` (NOT gpt-5-mini)
  - GitHub: `gpt-3.5-turbo` or similar

---

## Still Having Issues?

1. Run the diagnostic: `npm run diagnose`
2. Check the error logs in `error.log` and `combined.log`
3. Verify all `.env` settings
4. Try a different API provider
5. Check your internet connection

---

## Support Resources

- OpenAI Help: https://help.openai.com
- GitHub Copilot: https://github.com/features/copilot
- Brave Search API: https://api.search.brave.com
- DuckDuckGo: https://duckduckgo.com
