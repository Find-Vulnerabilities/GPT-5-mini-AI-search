# GPT-5 Mini with Web Search

A complete implementation that adds web search capabilities to GPT-5 mini using free APIs. This project enables real-time information retrieval and combines it with GPT-5 mini's language capabilities.

## Features

- 🤖 **GPT-5 Mini Integration** - Uses GitHub Copilot (free, 50 requests/month) or OpenAI API
- 🔍 **Web Search** - Multiple search providers with fallback (Brave Search API, DuckDuckGo)
- 📚 **Source Attribution** - Responses include links to sources
- ⚡ **Rate Limiting** - Built-in rate limiter for free tier compliance
- 🔄 **Retry Logic** - Automatic retries with exponential backoff
- 📝 **Context Management** - Maintains conversation history within token limits
- 🛡️ **Error Handling** - Comprehensive error handling and logging

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- One of the following:
  - GitHub account (for Copilot free tier - 50 requests/month)
  - OpenAI API key (paid)
  - Brave Search API key (free tier: 2000 requests/month)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gpt5-mini-search.git
   cd gpt5-mini-search