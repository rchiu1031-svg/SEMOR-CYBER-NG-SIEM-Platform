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
  }
};
