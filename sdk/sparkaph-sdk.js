/**
 * Sparkaph SDK v1.0.0
 * Official JavaScript SDK for Sparkaph Mini Apps
 * 
 * Usage:
 * const sparkaph = new SparkaphSDK('YOUR_API_TOKEN');
 * 
 * Features:
 * - User authentication
 * - Messaging
 * - Data storage
 * - Payments
 */

class SparkaphSDK {
  constructor(apiToken, options = {}) {
    this.apiToken = apiToken;
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.userId = null;
  }

  /**
   * Initialize SDK with user token
   */
  async init(userToken) {
    try {
      const response = await this._request('/api/public/verify-user', {
        method: 'POST',
        body: { userToken }
      });
      
      this.userId = response.userId;
      return response;
    } catch (error) {
      console.error('Sparkaph SDK Init Error:', error);
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return this._request('/api/public/user');
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    return this._request(`/api/public/users/${userId}`);
  }

  /**
   * Send message to user
   */
  async sendMessage(recipientId, content) {
    return this._request('/api/public/messages/send', {
      method: 'POST',
      body: {
        userToken: this.userToken,
        recipientId,
        content
      }
    });
  }

  /**
   * Save data to storage
   */
  async saveData(key, value) {
    return this._request('/api/public/storage/save', {
      method: 'POST',
      body: { key, value }
    });
  }

  /**
   * Get data from storage
   */
  async getData(key) {
    return this._request(`/api/public/storage/get?key=${key}`);
  }

  /**
   * Delete data from storage
   */
  async deleteData(key) {
    return this._request('/api/public/storage/delete', {
      method: 'DELETE',
      body: { key }
    });
  }

  /**
   * Request payment from user
   */
  async requestPayment(amount, description) {
    return this._request('/api/public/payment/request', {
      method: 'POST',
      body: {
        amount,
        description
      }
    });
  }

  /**
   * Show notification to user
   */
  async showNotification(title, message) {
    // This would trigger a notification in the Sparkaph app
    return this._request('/api/public/notification', {
      method: 'POST',
      body: { title, message }
    });
  }

  /**
   * Internal request method
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    };

    const config = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Sparkaph API Error: ${response.status}`);
    }

    return response.json();
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SparkaphSDK;
}

if (typeof window !== 'undefined') {
  window.SparkaphSDK = SparkaphSDK;
}
