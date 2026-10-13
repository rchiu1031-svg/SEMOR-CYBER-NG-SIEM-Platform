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
   * Live Engine Monitoring & Subsystem Telemetry
   */
  async getEngineMetrics() {
    const response = await axios.get('/api/v1/engine/metrics');
    return response.data;
  },

  async getEngineDetail(id: string) {
    const response = await axios.get(`/api/v1/engine/${id}`);
    return response.data;
  },

  async testEngineConnection(id: string, url?: string) {
    const response = await axios.post(`/api/v1/engine/${id}/test-connection`, { url });
    return response.data;
  },

  async restartEngine(id: string) {
    const response = await axios.post(`/api/v1/engine/${id}/restart`);
    return response.data;
  },

  async restartAllEngines() {
    const response = await axios.post('/api/v1/engine/restart-all');
    return response.data;
  },

  async toggleEngineStatus(id: string) {
    const response = await axios.post(`/api/v1/engine/${id}/toggle`);
    return response.data;
  },

  async getEngineLogs(id: string) {
    const response = await axios.get(`/api/v1/engine/${id}/logs`);
    return response.data;
  },

  async getEngineThresholdRules() {
    const response = await axios.get('/api/v1/engine/thresholds/rules');
    return response.data;
  },

  async updateEngineThresholdRules(rules: any) {
    const response = await axios.put('/api/v1/engine/thresholds/rules', rules);
    return response.data;
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

  async sendRemoteLogTestEvent(params: {
    forwarderId?: string;
    destination?: string;
    port?: string;
    protocol?: string;
    format?: string;
    type?: string;
    scope?: string;
  }) {
    const response = await axios.post('/api/v1/settings/remotelog/send-test-event', params);
    return response.data;
  },

  async flushRemoteLogSpool() {
    const response = await axios.post('/api/v1/settings/remotelog/flush-spool');
    return response.data;
  },

  async getRemoteLogConfigExport(format: 'rsyslog' | 'vector' | 'fluentbit' = 'rsyslog') {
    const response = await axios.get('/api/v1/settings/remotelog/export-config', {
      params: { format }
    });
    return response.data;
  },

  async getRemoteLogStreamLogs() {
    const response = await axios.get('/api/v1/settings/remotelog/stream');
    return response.data;
  },

  async getRemoteLogStats() {
    const response = await axios.get('/api/v1/settings/remotelog/stats');
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
  },

  // NDR Traffic Alert Rules & Engine APIs
  async getNdrAlertRules() {
    const response = await axios.get('/api/v1/ndr/alert-rules');
    return response.data;
  },

  async createNdrAlertRule(rule: any) {
    const response = await axios.post('/api/v1/ndr/alert-rules', rule);
    return response.data;
  },

  async updateNdrAlertRule(id: string, rule: any) {
    const response = await axios.put(`/api/v1/ndr/alert-rules/${id}`, rule);
    return response.data;
  },

  async deleteNdrAlertRule(id: string) {
    const response = await axios.delete(`/api/v1/ndr/alert-rules/${id}`);
    return response.data;
  },

  async batchUpdateNdrThresholds(updates: any[]) {
    const response = await axios.put('/api/v1/ndr/alert-rules/batch-thresholds', { updates });
    return response.data;
  },

  async triggerNdrTestAlert(params: {
    ruleId: string;
    customValue?: number;
    severityOverride?: string;
  }) {
    const response = await axios.post('/api/v1/ndr/alert-rules/test-trigger', params);
    return response.data;
  },

  async resetNdrAlertRulesToDefaults() {
    const response = await axios.post('/api/v1/ndr/alert-rules/reset-defaults');
    return response.data;
  },

  async exportNdrAlertRules(format: 'json' | 'suricata' = 'json') {
    const response = await axios.get('/api/v1/ndr/alert-rules/export', {
      params: { format }
    });
    return response.data;
  },

  async importNdrAlertRules(rules: any[], overwrite: boolean = false) {
    const response = await axios.post('/api/v1/ndr/alert-rules/import', {
      rules,
      overwrite
    });
    return response.data;
  },

  // --- APM & Observability Insights APIs ---
  async getApmHealth() {
    const response = await axios.get('/api/v1/apm/health');
    return response.data;
  },

  async getApmTopology(env: string = 'prod') {
    const response = await axios.get('/api/v1/apm/topology', {
      params: { env }
    });
    return response.data;
  },

  async getApmMetrics(env: string = 'prod') {
    const response = await axios.get('/api/v1/apm/metrics', {
      params: { env }
    });
    return response.data;
  },

  async getApmTraces(query?: string, filter?: 'all' | 'error' | 'success') {
    const response = await axios.get('/api/v1/apm/traces', {
      params: { query, filter }
    });
    return response.data;
  },

  async getApmTraceById(traceId: string) {
    const response = await axios.get(`/api/v1/apm/traces/${traceId}`);
    return response.data;
  },

  async getApmGovernance() {
    const response = await axios.get('/api/v1/apm/governance');
    return response.data;
  },

  async updateApmSamplingRate(samplingRate: number) {
    const response = await axios.put('/api/v1/apm/governance/sampling', { samplingRate });
    return response.data;
  },

  async triggerApmEmergencyShedding() {
    const response = await axios.post('/api/v1/apm/governance/emergency-shedding');
    return response.data;
  },

  async getApmMaskingRules() {
    const response = await axios.get('/api/v1/apm/masking-rules');
    return response.data;
  },

  async addApmMaskingRule(rule: { name: string; regex: string; replacement: string }) {
    const response = await axios.post('/api/v1/apm/masking-rules', rule);
    return response.data;
  },

  async toggleApmMaskingRule(id: string) {
    const response = await axios.put(`/api/v1/apm/masking-rules/${id}/toggle`);
    return response.data;
  },

  async deleteApmMaskingRule(id: string) {
    const response = await axios.delete(`/api/v1/apm/masking-rules/${id}`);
    return response.data;
  },

  async simulateApmMasking(payload: string) {
    const response = await axios.post('/api/v1/apm/masking/simulate', { payload });
    return response.data;
  },

  async getApmProfilingTasks() {
    const response = await axios.get('/api/v1/apm/diagnostics/profiling-tasks');
    return response.data;
  },

  async createApmProfilingTask(task: { taskName: string; targetInstance: string; durationSeconds: number }) {
    const response = await axios.post('/api/v1/apm/diagnostics/profiling-tasks', task);
    return response.data;
  },

  async resetApmDefaults() {
    const response = await axios.post('/api/v1/apm/governance/reset-defaults');
    return response.data;
  },

  // --- NDR Alert Analytics & Rule Drilldown API ---
  async getNdrAlertAnalytics(params?: {
    timeRange?: string;
    severity?: string;
    protocol?: string;
    country?: string;
    ruleId?: string;
    search?: string;
  }) {
    const response = await axios.get('/api/v1/ndr/analytics/alerts-overview', { params });
    return response.data;
  },

  async simulateNdrRuleViolation(params: {
    ruleId?: string;
    customSeverity?: string;
    customProtocol?: string;
    customCountry?: string;
  }) {
    const response = await axios.post('/api/v1/ndr/analytics/simulate-violation', params);
    return response.data;
  },

  async mitigateNdrAlert(alertId: string, action: string, notes?: string) {
    const response = await axios.post('/api/v1/ndr/analytics/mitigate', {
      alertId,
      action,
      notes
    });
    return response.data;
  }
};

