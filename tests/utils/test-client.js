/**
 * Test client utility for API testing
 * Provides a unified interface for making HTTP requests to the API
 * Uses native Node.js fetch (Node 18+)
 */

class TestClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.timeout = 10000;
  }

  /**
   * GET request
   */
  async get(endpoint, config = {}) {
    return this._makeRequest(endpoint, 'GET', null, config);
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}, config = {}) {
    return this._makeRequest(endpoint, 'POST', data, config);
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}, config = {}) {
    return this._makeRequest(endpoint, 'PUT', data, config);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, config = {}) {
    return this._makeRequest(endpoint, 'DELETE', null, config);
  }

  /**
   * Make HTTP request using fetch
   */
  async _makeRequest(endpoint, method, data = null, config = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      let responseData;
      
      // Clone response before reading body to avoid "Body already read" error
      const responseClone = response.clone();
      
      try {
        responseData = await response.json();
      } catch {
        try {
          responseData = await responseClone.text();
        } catch {
          responseData = null;
        }
      }

      return this._formatResponse(response, responseData);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('⚠️  Serveur non démarré. Lancer: npm run dev');
      }
      throw error;
    }
  }

  /**
   * Format response for consistent testing
   */
  _formatResponse(response, data) {
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      success: response.status >= 200 && response.status < 300,
      error: response.status >= 400 ? data : null
    };
  }

  /**
   * Check if server is running
   */
  async isServerRunning() {
    try {
      const response = await this.get('/api/internal/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

module.exports = TestClient;
