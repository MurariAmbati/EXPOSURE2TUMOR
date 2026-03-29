// ============================================================
// Exposure2Tumor — Database Web Stub
// expo-sqlite doesn't support web; provide no-op fallback
// ============================================================

class ClinicalDatabaseWeb {
  async initialize(): Promise<void> {}
  async saveInvestigation(_inv: any): Promise<void> {}
  async getInvestigations(): Promise<unknown[]> { return []; }
  async deleteInvestigation(_id: string): Promise<void> {}
  async savePhoto(_photo: any): Promise<void> {}
  async getPhotos(): Promise<unknown[]> { return []; }
  async saveThread(_thread: any): Promise<void> {}
  async saveMessage(_msg: any): Promise<void> {}
  async getThreadMessages(_threadId: string): Promise<unknown[]> { return []; }
  async getThreads(): Promise<unknown[]> { return []; }
  async saveAlert(_alert: any): Promise<void> {}
  async getAlerts(): Promise<unknown[]> { return []; }
  async savePrediction(_pred: any): Promise<void> {}
  async getPredictions(): Promise<unknown[]> { return []; }
  async saveScenario(_scenario: any): Promise<void> {}
  async getScenarios(): Promise<unknown[]> { return []; }
  async cacheGeoData(_key: string, _data: unknown, _source: string, _level: string, _ttlHours?: number): Promise<void> {}
  async getCachedGeoData(_key: string): Promise<unknown | null> { return null; }
  async search(_query: string): Promise<unknown[]> { return []; }
  async clearExpiredCache(): Promise<void> {}
}

export const clinicalDb = new ClinicalDatabaseWeb();
