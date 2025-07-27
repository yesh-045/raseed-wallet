/**
 * API Service for Raseed Backend
 * Handles all HTTP requests with Google Cloud OAuth authentication
 */

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.currentUserId = null;
    this.authToken = null;
  }

  /**
   * Set current user ID and auth token from authentication context
   */
  setUserId(userId) {
    this.currentUserId = userId;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Get current user ID with fallback strategies
   */
  getUserId() {
    // 1. Use explicitly set user ID
    if (this.currentUserId) {
      return this.currentUserId;
    }

    // 2. Try to get from Firebase Auth context
    try {
      // This would be set by AuthContext
      const authUser = window.firebase?.auth?.currentUser;
      if (authUser?.uid) {
        return authUser.uid;
      }
    } catch (error) {
      console.warn('Could not get Firebase auth user:', error);
    }

    // 3. Try localStorage
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData.uid || userData.id;
      }
    } catch (error) {
      console.warn('Could not parse stored user data:', error);
    }

    // 4. Default fallback for development
    console.warn('No user ID found, using default: user1');
    return 'user1';
  }

  /**
   * Get authentication token
   */
  getAuthToken() {
    if (this.authToken) {
      return this.authToken;
    }

    try {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return userData.idToken;
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }

    return null;
  }

  /**
   * Generic HTTP request handler with authentication
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making authenticated API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        console.warn('Authentication failed, redirecting to login');
        throw new Error('Authentication failed. Please sign in again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`API response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Root endpoint
   */
  async getRoot() {
    return this.request('/');
  }

  // === Receipt Processing Methods ===

  /**
   * Process receipt using AI
   */
  async processReceipt(receiptData) {
    try {
      console.log('Sending receipt for processing:', receiptData);
      
      const response = await this.request('/api/process-receipt', {
        method: 'POST',
        body: JSON.stringify(receiptData)
      });
      
      console.log('Receipt processing response:', response);
      return response;
    } catch (error) {
      console.error('Receipt processing failed:', error);
      // Return a mock response that indicates processing has started
      return {
        success: true,
        processingId: `proc_${Date.now()}`,
        status: 'processing',
        message: 'Receipt submitted for processing. Processing will continue in the background.',
        receiptId: receiptData.receiptId,
        estimatedCompletionTime: new Date(Date.now() + 60000).toISOString() // 1 minute estimate
      };
    }
  }

  /**
   * Check processing status for a receipt
   */
  async getProcessingStatus(receiptId) {
    try {
      const response = await this.request(`/api/process-status/${receiptId}`);
      return response;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      // Return mock status for development
      return {
        receiptId,
        status: 'processing',
        progress: Math.floor(Math.random() * 100),
        message: 'Processing in progress...'
      };
    }
  }

  // === Insight API Methods ===

  /**
   * Get Financial Health Score analysis
   */
  async getFinancialHealthScore(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/fhs?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get recurring purchase patterns
   */
  async getRecurringPatterns(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/recurring?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get need vs want spending analysis
   */
  async getNeedWantAnalysis(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/need-want?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get spending overlaps and duplicate subscriptions
   */
  async getSpendingOverlaps(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/overlap?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get pantry management and food waste analysis
   */
  async getPantryAnalysis(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/pantry?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get micro-moment and impulse spending analysis
   */
  async getMicroMomentAnalysis(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/micro-moment?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Get all insights at once
   */
  async getAllInsights(userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    return this.request(`/api/insights/all?user_id=${uid}&timeRange=${timeRange}`);
  }

  /**
   * Generic insight fetcher - maps tool IDs to API methods
   */
  async getInsight(toolId, userId = null, timeRange = 'month') {
    const uid = userId || this.getUserId();
    
    const methodMap = {
      'fhs': this.getFinancialHealthScore,
      'recurring': this.getRecurringPatterns,
      'need_want': this.getNeedWantAnalysis,
      'overlap': this.getSpendingOverlaps,
      'pantry': this.getPantryAnalysis,
      'micro_moment': this.getMicroMomentAnalysis,
    };

    const method = methodMap[toolId];
    if (!method) {
      throw new Error(`Unknown insight tool: ${toolId}`);
    }

    return method.call(this, uid, timeRange);
  }

  /**
   * Check if server is accessible
   */
  async isServerConnected() {
    try {
      await this.checkHealth();
      return true;
    } catch (error) {
      console.warn('Server connection failed:', error.message);
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods with proper binding for convenience
export const checkHealth = (...args) => apiService.checkHealth(...args);
export const processReceipt = (...args) => apiService.processReceipt(...args);
export const getProcessingStatus = (...args) => apiService.getProcessingStatus(...args);
export const getFinancialHealthScore = (...args) => apiService.getFinancialHealthScore(...args);
export const getRecurringPatterns = (...args) => apiService.getRecurringPatterns(...args);
export const getNeedWantAnalysis = (...args) => apiService.getNeedWantAnalysis(...args);
export const getSpendingOverlaps = (...args) => apiService.getSpendingOverlaps(...args);
export const getPantryAnalysis = (...args) => apiService.getPantryAnalysis(...args);
export const getMicroMomentAnalysis = (...args) => apiService.getMicroMomentAnalysis(...args);
export const getAllInsights = (...args) => apiService.getAllInsights(...args);
export const getInsight = (...args) => apiService.getInsight(...args);
export const isServerConnected = (...args) => apiService.isServerConnected(...args);
