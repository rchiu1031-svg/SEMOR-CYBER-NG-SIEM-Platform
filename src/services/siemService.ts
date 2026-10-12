import axios from 'axios';

export interface LogRecord {
  _msg?: string;
  _time?: string;
  _stream?: string;
  [key: string]: any;
}

export const siemService = {
  /**
   * Fetch logs from VictoriaLogs via the local proxy
   */
  async fetchLogs(query: string = '*', limit: number = 50): Promise<LogRecord[]> {
    try {
      const response = await axios.get('/api/logs', {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('SIEM Service Error:', error);
      throw error;
    }
  },

  /**
   * Health check for the SIEM backend
   */
  async checkHealth() {
    try {
      const response = await axios.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('SIEM Health Check Failed:', error);
      return { status: 'error' };
    }
  },

  /**
   * Fetch engine configurations
   */
  async getEngineConfigs() {
    try {
      const response = await axios.get('/api/config/engines');
      return response.data;
    } catch (error) {
      console.error('Failed to get engine configs:', error);
      throw error;
    }
  },

  /**
   * Update engine configuration
   */
  async updateEngineConfig(engine: string, config: any) {
    try {
      const response = await axios.post('/api/config/engines', { engine, config });
      return response.data;
    } catch (error) {
      console.error(`Failed to update ${engine} config:`, error);
      throw error;
    }
  },

  /**
   * User Management
   */
  async login(credentials: any) {
    const response = await axios.post('/api/auth/login', credentials);
    return response.data;
  },

  async getUsers() {
    const response = await axios.get('/api/users');
    return response.data;
  },

  async addUser(user: any) {
    const response = await axios.post('/api/users', user);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await axios.delete(`/api/users/${id}`);
    return response.data;
  },

  async updateUser(id: string, updates: any) {
    const response = await axios.patch(`/api/users/${id}`, updates);
    return response.data;
  },

  /**
   * Comprehensive Settings APIs
   */
  async getAllSettings() {
    const response = await axios.get('/api/v1/settings/all');
    return response.data;
  },

  async saveAllSettings(payload: any) {
    const response = await axios.post('/api/v1/settings/all', payload);
    return response.data;
  },

  async getNetworkSettings() {
    const response = await axios.get('/api/v1/settings/network');
    return response.data;
  },

  async updateNetworkSettings(payload: any) {
    const response = await axios.put('/api/v1/settings/network', payload);
    return response.data;
  },

  async testNetworkPing(target: string, type: string = 'icmp_ping') {
    const response = await axios.post('/api/v1/settings/network/test', { target, type });
    return response.data;
  },

  async getGeneralSettings() {
    const response = await axios.get('/api/v1/settings/general');
    return response.data;
  },

  async updateGeneralSettings(payload: any) {
    const response = await axios.put('/api/v1/settings/general', payload);
    return response.data;
  },

  async testGeminiKey(apiKey: string, model?: string) {
    const response = await axios.post('/api/v1/settings/general/test-gemini', { apiKey, model });
    return response.data;
  },

  async getAuthSettings() {
    const response = await axios.get('/api/v1/settings/auth');
    return response.data;
  },

  async updateAuthSettings(payload: any) {
    const response = await axios.put('/api/v1/settings/auth', payload);
    return response.data;
  },

  async testAuthConnection(params: { type: string; host?: string; port?: number; domain?: string }) {
    const response = await axios.post('/api/v1/settings/auth/test-connection', params);
    return response.data;
  },

  async simulateAuthLogin(username: string) {
    const response = await axios.post('/api/v1/settings/auth/simulate-login', { username });
    return response.data;
  },

  async getDataCollectionSettings() {
    const response = await axios.get('/api/v1/settings/collection');
    return response.data;
  },

  async updateDataCollectionSettings(payload: any) {
    const response = await axios.put('/api/v1/settings/collection', payload);
    return response.data;
  },

  async addDataCollectionSource(source: any) {
    const response = await axios.post('/api/v1/settings/collection/add-source', source);
    return response.data;
  },

  async deleteDataCollectionSource(id: string) {
    const response = await axios.delete(`/api/v1/settings/collection/source/${id}`);
    return response.data;
  },

  async getRemoteLogSettings() {
    const response = await axios.get('/api/v1/settings/remotelog');
    return response.data;
  },

  async saveRemoteForwarder(forwarder: any) {
    const response = await axios.post('/api/v1/settings/remotelog/forwarders', forwarder);
    return response.data;
  },

  async deleteRemoteForwarder(id: string) {
    const response = await axios.delete(`/api/v1/settings/remotelog/forwarders/${id}`);
    return response.data;
  },

  async toggleRemoteForwarder(id: string) {
    const response = await axios.put(`/api/v1/settings/remotelog/forwarders/${id}/toggle`);
    return response.data;
  },

  async testRemoteLogConnection(params: { destination: string; port: string; protocol: string }) {
    const response = await axios.post('/api/v1/settings/remotelog/test-connection', params);
    return response.data;
  },

  async updateRemoteLogGlobalSettings(settings: any) {
    const response = await axios.put('/api/v1/settings/remotelog/global', settings);
    return response.data;
  },

  async getThreatIntelFeeds() {
    const response = await axios.get('/api/v1/settings/threat-intel/feeds');
    return response.data;
  },

  async saveThreatIntelFeed(feed: any) {
    const response = await axios.post('/api/v1/settings/threat-intel/feeds', feed);
    return response.data;
  },

  async deleteThreatIntelFeed(id: string) {
    const response = await axios.delete(`/api/v1/settings/threat-intel/feeds/${id}`);
    return response.data;
  },

  async syncThreatIntelFeed(id: string) {
    const response = await axios.post(`/api/v1/settings/threat-intel/feeds/${id}/sync`);
    return response.data;
  }
};
