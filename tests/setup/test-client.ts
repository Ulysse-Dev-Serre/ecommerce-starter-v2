/**
 * Test client utility for API testing (TypeScript version)
 * Provides a unified interface for making HTTP requests to the API
 */

export interface TestResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  success: boolean;
  error: any;
}

export class TestClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.timeout = 10000;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    return this._makeRequest<T>(endpoint, 'GET', null, config);
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data: any = {},
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    return this._makeRequest<T>(endpoint, 'POST', data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data: any = {},
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    return this._makeRequest<T>(endpoint, 'PUT', data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data: any = {},
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    return this._makeRequest<T>(endpoint, 'PATCH', data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    return this._makeRequest<T>(endpoint, 'DELETE', null, config);
  }

  /**
   * Make HTTP request using fetch
   */
  private async _makeRequest<T>(
    endpoint: string,
    method: string,
    data: any = null,
    config: RequestInit = {}
  ): Promise<TestResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const options: RequestInit = {
      ...config,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      let responseData: any;

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
    } catch (error: any) {
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
  private _formatResponse<T>(response: Response, data: any): TestResponse<T> {
    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
      success: response.status >= 200 && response.status < 300,
      error: response.status >= 400 ? data : null,
    };
  }

  /**
   * Check if server is running
   */
  async isServerRunning(): Promise<boolean> {
    try {
      const response = await this.get('/api/internal/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }
}
