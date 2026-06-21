// Sparkaph SDK для внедрения в iframe приложений
// Обеспечивает безопасный доступ к API без раскрытия токенов

export class SparkaphSDK {
  private apiToken: string;
  private appId: string;
  private apiUrl: string;

  constructor(apiToken: string, appId: string, apiUrl: string = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`) {
    this.apiToken = apiToken;
    this.appId = appId;
    this.apiUrl = apiUrl;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('SDK: Error getting current user:', error);
      return null;
    }
  }

  // Get data (user-specific)
  async getData(key: string) {
    try {
      const response = await fetch(`${this.apiUrl}/app/data?key=${key}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.value;
      }
      return null;
    } catch (error) {
      console.error('SDK: Error getting data:', error);
      return null;
    }
  }

  // Set data (user-specific)
  async setData(key: string, value: string) {
    try {
      const response = await fetch(`${this.apiUrl}/app/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value })
      });
      return response.ok;
    } catch (error) {
      console.error('SDK: Error setting data:', error);
      return false;
    }
  }

  // Get all user data keys
  async getAllKeys() {
    try {
      const response = await fetch(`${this.apiUrl}/app/data/keys`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('SDK: Error getting keys:', error);
      return [];
    }
  }

  // Delete data
  async deleteData(key: string) {
    try {
      const response = await fetch(`${this.apiUrl}/app/data?key=${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('SDK: Error deleting data:', error);
      return false;
    }
  }
}

// SDK Injector - внедряет SDK в iframe приложения
export function injectSDKIntoIframe(iframe: HTMLIFrameElement, apiToken: string, appId: string) {
  const sdk = new SparkaphSDK(apiToken, appId);

  // Listen for SDK requests from iframe
  window.addEventListener('message', async (event) => {
    // Security: check origin
    if (event.source !== iframe.contentWindow) return;

    const { type, method, params } = event.data;

    if (type === 'REQUEST_SPARKAPH_SDK') {
      // Send SDK ready message
      iframe.contentWindow?.postMessage({
        type: 'SPARKAPH_SDK_READY',
        sdk: {
          version: '1.0.0',
          appId: appId
        }
      }, '*');
    }

    if (type === 'SPARKAPH_API_CALL') {
      let result = null;

      switch (method) {
        case 'getCurrentUser':
          result = await sdk.getCurrentUser();
          break;
        case 'getData':
          result = await sdk.getData(params.key);
          break;
        case 'setData':
          result = await sdk.setData(params.key, params.value);
          break;
        case 'getAllKeys':
          result = await sdk.getAllKeys();
          break;
        case 'deleteData':
          result = await sdk.deleteData(params.key);
          break;
      }

      // Send response back to iframe
      iframe.contentWindow?.postMessage({
        type: 'SPARKAPH_API_RESPONSE',
        method: method,
        data: result
      }, '*');
    }
  });
}
