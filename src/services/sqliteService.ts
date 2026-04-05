/**
 * src/services/sqliteService.ts
 *
 * SQLite database service for local-first annotation storage.
 * Manages in-memory SQLite DB with GitHub sync to user's private repo.
 *
 * Schema:
 *   - annotations: (id, task_type, label, rle, timestamp)
 *   - daily_stats: (date, completed_ids JSON, points, streak)
 */

import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let dbInitializing: Promise<void> | null = null;

/**
 * Initialize or return the SQLite database
 */
async function getDB(): Promise<Database> {
  if (db) return db;
  if (dbInitializing) await dbInitializing;
  if (db) return db;

  dbInitializing = (async () => {
    const SQL = await initSqlJs();
    db = new SQL.Database();

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS annotations (
        id TEXT PRIMARY KEY,
        task_type TEXT,
        label TEXT,
        rle TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        date TEXT PRIMARY KEY,
        completed_ids TEXT,
        points INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0
      )
    `);
  })();

  await dbInitializing;
  if (!db) throw new Error('Failed to initialize SQLite DB');
  return db;
}

/**
 * Load database from serialized bytes (from GitHub)
 */
export async function loadDBFromBytes(bytes: Uint8Array): Promise<void> {
  const SQL = await initSqlJs();
  db = new SQL.Database(bytes);
}

/**
 * Check if an annotation already exists
 */
export async function checkAnnotationExists(taskId: string): Promise<boolean> {
  const database = await getDB();
  const result = database.exec(
    'SELECT id FROM annotations WHERE id = ?',
    [taskId]
  );
  return result.length > 0 && result[0].values.length > 0;
}

/**
 * Insert an annotation
 */
export async function insertAnnotation(
  id: string,
  taskType: string,
  label: string,
  rle: string
): Promise<void> {
  const database = await getDB();
  database.run(
    'INSERT INTO annotations (id, task_type, label, rle, timestamp) VALUES (?, ?, ?, ?, ?)',
    [id, taskType, label, rle, new Date().toISOString()]
  );
}

/**
 * Get daily stats for a specific date
 */
export async function getDailyStats(dateKey: string): Promise<{
  completedIds: Set<string>;
  points: number;
  streak: number;
} | null> {
  const database = await getDB();
  const result = database.exec(
    'SELECT completed_ids, points, streak FROM daily_stats WHERE date = ?',
    [dateKey]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [completedIdsJson, points, streak] = result[0].values[0];
  return {
    completedIds: new Set(JSON.parse(completedIdsJson as string)),
    points: points as number,
    streak: streak as number,
  };
}

/**
 * Update daily stats
 */
export async function updateDailyStats(
  dateKey: string,
  completedIds: Set<string>,
  points: number,
  streak: number
): Promise<void> {
  const database = await getDB();

  // First try to update
  database.run(
    'UPDATE daily_stats SET completed_ids = ?, points = ?, streak = ? WHERE date = ?',
    [JSON.stringify([...completedIds]), points, streak, dateKey]
  );

  // If no rows were updated, insert
  const result = database.exec('SELECT changes() as changes');
  const changes = result[0]?.values[0]?.[0] || 0;

  if (changes === 0) {
    database.run(
      'INSERT INTO daily_stats (date, completed_ids, points, streak) VALUES (?, ?, ?, ?)',
      [dateKey, JSON.stringify([...completedIds]), points, streak]
    );
  }
}

/**
 * Export database to bytes for GitHub storage
 */
export async function exportDB(): Promise<Uint8Array> {
  const database = await getDB();
  return database.export();
}

/**
 * Query all annotations for a date
 */
export async function getAnnotationsByDate(dateKey: string): Promise<any[]> {
  const database = await getDB();
  const result = database.exec(
    `SELECT * FROM annotations WHERE DATE(timestamp) = ?`,
    [dateKey]
  );

  if (result.length === 0) return [];

  const rows = result[0].values;
  return rows.map(row => ({
    id: row[0],
    task_type: row[1],
    label: row[2],
    rle: row[3],
    timestamp: row[4],
  }));
}

/**
 * Clean up old data (before a certain date)
 */
export async function cleanupOldData(beforeDate: string): Promise<void> {
  const database = await getDB();
  database.run(
    'DELETE FROM daily_stats WHERE date < ?',
    [beforeDate]
  );
}
