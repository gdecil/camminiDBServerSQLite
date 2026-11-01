'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbFile = path.resolve(process.env.DB_FILE || path.join(__dirname, '..', 'data', 'cammini.sqlite'));
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA journal_mode = WAL');

function prepareSql(sql) {
    return sql.replace(/::jsonb\b/gi, '').replace(/\$(\d+)/g, '?$1');
}

function query(sql, params = []) {
    const statement = db.prepare(prepareSql(sql));
    const values = Array.isArray(params) ? params : [params];

    if (statement.columns().length > 0) {
        const rows = statement.all(...values).map((row) => ({ ...row }));
        return { rows, rowCount: rows.length, changes: 0 };
    }

    const result = statement.run(...values);
    return { rows: [], rowCount: result.changes, changes: result.changes };
}

async function withTransaction(callback) {
    db.exec('BEGIN IMMEDIATE');
    try {
        const result = await callback({ query });
        db.exec('COMMIT');
        return result;
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            name TEXT,
            start_lat REAL,
            start_lng REAL,
            end_lat REAL,
            end_lng REAL,
            distance TEXT,
            coordinates TEXT,
            elevation TEXT,
            waypoints TEXT,
            ascent INTEGER,
            descent INTEGER,
            min_ele INTEGER,
            max_ele INTEGER,
            photo_folder_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tracks (
            id TEXT PRIMARY KEY,
            name TEXT,
            coordinates TEXT,
            elevation TEXT,
            waypoints TEXT,
            photo_folder_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS photo_geolocations (
            id TEXT PRIMARY KEY,
            track_id TEXT NOT NULL,
            photo_path TEXT NOT NULL,
            photo_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_photo_geolocations_track_created
            ON photo_geolocations (track_id, created_at);
    `);

    const trackColumns = db.prepare('PRAGMA table_info(tracks)').all();
    if (!trackColumns.some((column) => column.name === 'waypoints')) {
        db.exec('ALTER TABLE tracks ADD COLUMN waypoints TEXT');
    }
}

function closePool() {
    db.close();
}

module.exports = { query, withTransaction, initSchema, closePool, dbFile };
