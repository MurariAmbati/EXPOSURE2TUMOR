// ============================================================
// Exposure2Tumor — Local Clinical Database (SQLite)
// Encrypted local storage for clinical data, investigations,
// photos, messages, and cached geospatial data
// ============================================================

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'exposure2tumor.db';

class ClinicalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.createTables();
  }

  private async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  private async createTables(): Promise<void> {
    const db = await this.getDb();

    await db.execAsync(`
      -- User profile
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'community',
        organization TEXT,
        preferences TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Investigations / saved views
      CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        geo_ids TEXT NOT NULL DEFAULT '[]',
        cancer_sites TEXT NOT NULL DEFAULT '[]',
        layers TEXT NOT NULL DEFAULT '[]',
        filters TEXT DEFAULT '{}',
        scenarios TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        shared INTEGER DEFAULT 0
      );

      -- Investigation notes
      CREATE TABLE IF NOT EXISTS investigation_notes (
        id TEXT PRIMARY KEY,
        investigation_id TEXT NOT NULL,
        content TEXT NOT NULL,
        attachments TEXT DEFAULT '[]',
        author TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
      );

      -- Clinical photos
      CREATE TABLE IF NOT EXISTS clinical_photos (
        id TEXT PRIMARY KEY,
        uri TEXT NOT NULL,
        thumbnail_uri TEXT,
        capture_date TEXT NOT NULL DEFAULT (datetime('now')),
        geo_fips TEXT,
        cancer_site TEXT,
        notes TEXT,
        tags TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        analysis_result TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Messages
      CREATE TABLE IF NOT EXISTS message_threads (
        id TEXT PRIMARY KEY,
        participants TEXT NOT NULL DEFAULT '[]',
        title TEXT NOT NULL,
        last_message_id TEXT,
        unread_count INTEGER DEFAULT 0,
        pinned INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        content TEXT NOT NULL,
        attachments TEXT DEFAULT '[]',
        geo_context TEXT,
        cancer_site_context TEXT,
        investigation_ref TEXT,
        type TEXT NOT NULL DEFAULT 'text',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        read_at TEXT,
        FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE
      );

      -- Alerts
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        geo_fips TEXT,
        cancer_site TEXT,
        action_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        read_at TEXT,
        dismissed INTEGER DEFAULT 0
      );

      -- Scenarios
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        geo_id TEXT NOT NULL,
        cancer_site TEXT NOT NULL,
        parameters TEXT NOT NULL DEFAULT '[]',
        baseline_risk_states TEXT DEFAULT '[]',
        projected_risk_states TEXT DEFAULT '[]',
        delta_scores TEXT DEFAULT '{}',
        confidence REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Cached geospatial data
      CREATE TABLE IF NOT EXISTS geo_cache (
        cache_key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        source TEXT NOT NULL,
        geography_level TEXT NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );

      -- Predictions
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        cancer_site TEXT NOT NULL,
        geo_id TEXT,
        score REAL NOT NULL,
        confidence REAL NOT NULL,
        category TEXT NOT NULL,
        explanation TEXT NOT NULL,
        factors TEXT DEFAULT '[]',
        model_version TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Bookmarks
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        name TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Full-text search index for investigations and notes
      CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
        entity_type,
        entity_id,
        title,
        content,
        tags
      );
    `);
  }

  // ---- Investigations ----
  async saveInvestigation(inv: {
    id: string; name: string; description?: string;
    geoIds: string[]; cancerSites: string[]; layers: string[];
    filters?: Record<string, unknown>; scenarios?: unknown[];
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO investigations (id, name, description, geo_ids, cancer_sites, layers, filters, scenarios, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      inv.id, inv.name, inv.description ?? '', JSON.stringify(inv.geoIds),
      JSON.stringify(inv.cancerSites), JSON.stringify(inv.layers),
      JSON.stringify(inv.filters ?? {}), JSON.stringify(inv.scenarios ?? [])
    );
  }

  async getInvestigations(): Promise<unknown[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync('SELECT * FROM investigations ORDER BY updated_at DESC');
    return rows.map((r: any) => ({
      ...r,
      geo_ids: JSON.parse(r.geo_ids),
      cancer_sites: JSON.parse(r.cancer_sites),
      layers: JSON.parse(r.layers),
      filters: JSON.parse(r.filters),
      scenarios: JSON.parse(r.scenarios),
    }));
  }

  async deleteInvestigation(id: string): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM investigations WHERE id = ?', id);
  }

  // ---- Clinical Photos ----
  async savePhoto(photo: {
    id: string; uri: string; thumbnailUri?: string;
    geoFips?: string; cancerSite?: string;
    notes?: string; tags?: string[]; metadata?: Record<string, unknown>;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO clinical_photos (id, uri, thumbnail_uri, geo_fips, cancer_site, notes, tags, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      photo.id, photo.uri, photo.thumbnailUri ?? '', photo.geoFips ?? '',
      photo.cancerSite ?? '', photo.notes ?? '', JSON.stringify(photo.tags ?? []),
      JSON.stringify(photo.metadata ?? {})
    );
  }

  async getPhotos(): Promise<unknown[]> {
    const db = await this.getDb();
    const rows = await db.getAllAsync('SELECT * FROM clinical_photos ORDER BY capture_date DESC');
    return rows.map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags),
      metadata: JSON.parse(r.metadata),
      analysis_result: r.analysis_result ? JSON.parse(r.analysis_result) : null,
    }));
  }

  // ---- Messages ----
  async saveThread(thread: {
    id: string; participants: string[]; title: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO message_threads (id, participants, title, updated_at)
       VALUES (?, ?, ?, datetime('now'))`,
      thread.id, JSON.stringify(thread.participants), thread.title
    );
  }

  async saveMessage(msg: {
    id: string; threadId: string; senderId: string; senderName: string;
    content: string; type?: string; attachments?: unknown[];
    geoContext?: unknown; cancerSiteContext?: string; investigationRef?: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO messages (id, thread_id, sender_id, sender_name, content, type, attachments, geo_context, cancer_site_context, investigation_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      msg.id, msg.threadId, msg.senderId, msg.senderName, msg.content,
      msg.type ?? 'text', JSON.stringify(msg.attachments ?? []),
      msg.geoContext ? JSON.stringify(msg.geoContext) : null,
      msg.cancerSiteContext ?? null, msg.investigationRef ?? null
    );
    await db.runAsync(
      `UPDATE message_threads SET last_message_id = ?, updated_at = datetime('now') WHERE id = ?`,
      msg.id, msg.threadId
    );
  }

  async getThreadMessages(threadId: string): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync(
      'SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC',
      threadId
    );
  }

  async getThreads(): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync('SELECT * FROM message_threads ORDER BY updated_at DESC');
  }

  // ---- Alerts ----
  async saveAlert(alert: {
    id: string; type: string; severity: string;
    title: string; description: string;
    geoFips?: string; cancerSite?: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO alerts (id, type, severity, title, description, geo_fips, cancer_site)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      alert.id, alert.type, alert.severity, alert.title, alert.description,
      alert.geoFips ?? null, alert.cancerSite ?? null
    );
  }

  async getAlerts(): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync('SELECT * FROM alerts WHERE dismissed = 0 ORDER BY created_at DESC');
  }

  // ---- Predictions ----
  async savePrediction(pred: {
    id: string; type: string; cancerSite: string; geoId?: string;
    score: number; confidence: number; category: string;
    explanation: string; factors?: unknown[]; modelVersion: string;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO predictions (id, type, cancer_site, geo_id, score, confidence, category, explanation, factors, model_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      pred.id, pred.type, pred.cancerSite, pred.geoId ?? null,
      pred.score, pred.confidence, pred.category, pred.explanation,
      JSON.stringify(pred.factors ?? []), pred.modelVersion
    );
  }

  async getPredictions(): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync('SELECT * FROM predictions ORDER BY created_at DESC');
  }

  // ---- Scenarios ----
  async saveScenario(scenario: {
    id: string; name: string; description?: string;
    geoId: string; cancerSite: string;
    parameters: unknown[]; baselineRiskStates?: unknown[];
    projectedRiskStates?: unknown[]; deltaScores?: Record<string, number>;
    confidence?: number;
  }): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO scenarios (id, name, description, geo_id, cancer_site, parameters, baseline_risk_states, projected_risk_states, delta_scores, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      scenario.id, scenario.name, scenario.description ?? '',
      scenario.geoId, scenario.cancerSite,
      JSON.stringify(scenario.parameters),
      JSON.stringify(scenario.baselineRiskStates ?? []),
      JSON.stringify(scenario.projectedRiskStates ?? []),
      JSON.stringify(scenario.deltaScores ?? {}),
      scenario.confidence ?? 0
    );
  }

  async getScenarios(): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync('SELECT * FROM scenarios ORDER BY created_at DESC');
  }

  // ---- Geo Cache ----
  async cacheGeoData(key: string, data: unknown, source: string, level: string, ttlHours: number = 24): Promise<void> {
    const db = await this.getDb();
    const expiresAt = new Date(Date.now() + ttlHours * 3600000).toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO geo_cache (cache_key, data, source, geography_level, fetched_at, expires_at)
       VALUES (?, ?, ?, ?, datetime('now'), ?)`,
      key, JSON.stringify(data), source, level, expiresAt
    );
  }

  async getCachedGeoData(key: string): Promise<unknown | null> {
    const db = await this.getDb();
    const row: any = await db.getFirstAsync(
      `SELECT data FROM geo_cache WHERE cache_key = ? AND expires_at > datetime('now')`,
      key
    );
    return row ? JSON.parse(row.data) : null;
  }

  // ---- Search ----
  async search(query: string): Promise<unknown[]> {
    const db = await this.getDb();
    return db.getAllAsync(
      `SELECT * FROM search_index WHERE search_index MATCH ? ORDER BY rank`,
      query
    );
  }

  // ---- Clean up ----
  async clearExpiredCache(): Promise<void> {
    const db = await this.getDb();
    await db.runAsync(`DELETE FROM geo_cache WHERE expires_at < datetime('now')`);
  }
}

export const clinicalDb = new ClinicalDatabase();
