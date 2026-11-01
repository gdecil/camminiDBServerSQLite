'use strict';

require('dotenv').config({ quiet: true });

const { Pool } = require('pg');
const { initSchema, query, withTransaction, dbFile } = require('./db.cjs');

const BATCH_SIZE = 500;
const TABLES = [
    {
        name: 'tracks',
        columns: ['id', 'name', 'coordinates', 'elevation', 'waypoints', 'photo_folder_path', 'created_at'],
        jsonColumns: ['coordinates', 'elevation', 'waypoints']
    },
    {
        name: 'routes',
        columns: [
            'id', 'name', 'start_lat', 'start_lng', 'end_lat', 'end_lng', 'distance',
            'coordinates', 'elevation', 'waypoints', 'ascent', 'descent', 'min_ele',
            'max_ele', 'photo_folder_path', 'created_at'
        ],
        jsonColumns: ['coordinates', 'elevation', 'waypoints']
    },
    {
        name: 'photo_geolocations',
        columns: ['id', 'track_id', 'photo_path', 'photo_name', 'latitude', 'longitude', 'created_at', 'updated_at'],
        jsonColumns: []
    }
];

function getPostgresConfig() {
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL, ssl: false };
    }

    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_DATABASE'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Configurazione PostgreSQL incompleta: ${missing.join(', ')}`);
    }

    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: false
    };
}

function toSqliteValue(value, column, jsonColumns) {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'boolean') return Number(value);
    if (jsonColumns.includes(column)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
}

function makeUpsert(table) {
    const placeholders = table.columns.map((_, index) => `?${index + 1}`).join(', ');
    const updates = table.columns
        .filter((column) => column !== 'id')
        .map((column) => `${column} = excluded.${column}`)
        .join(', ');
    return `INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET ${updates}`;
}

async function main() {
    const pg = new Pool({ ...getPostgresConfig(), connectionTimeoutMillis: 10000 });

    try {
        await pg.query('SELECT 1');
        const existingTables = await pg.query(
            `SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        );
        const availableTables = new Set(existingTables.rows.map((row) => row.table_name));

        for (const table of TABLES) {
            if (!availableTables.has(table.name)) {
                throw new Error(`Tabella PostgreSQL public.${table.name} non trovata`);
            }

            const result = await pg.query(
                `SELECT column_name FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = $1`,
                [table.name]
            );
            const availableColumns = new Set(result.rows.map((row) => row.column_name));
            const missingColumns = table.columns.filter((column) => !availableColumns.has(column));
            if (missingColumns.length > 0) {
                throw new Error(`Colonne mancanti in public.${table.name}: ${missingColumns.join(', ')}`);
            }
        }

        initSchema();
        const counts = Object.fromEntries(TABLES.map((table) => [table.name, 0]));
        await withTransaction(async ({ query: sqliteQuery }) => {
            for (const table of TABLES) {
                const columns = table.columns.join(', ');
                const upsert = makeUpsert(table);
                for (let offset = 0; ; offset += BATCH_SIZE) {
                    const page = await pg.query(
                        `SELECT ${columns} FROM public.${table.name} ORDER BY id LIMIT $1 OFFSET $2`,
                        [BATCH_SIZE, offset]
                    );

                    for (const row of page.rows) {
                        const values = table.columns.map((column) =>
                            toSqliteValue(row[column], column, table.jsonColumns)
                        );
                        await sqliteQuery(upsert, values);
                        counts[table.name] += 1;
                    }

                    if (page.rows.length < BATCH_SIZE) break;
                }
            }
        });

        for (const table of TABLES) {
            const result = await pg.query(`SELECT count(*)::int AS count FROM public.${table.name}`);
            if (counts[table.name] !== result.rows[0].count) {
                throw new Error(`Verifica fallita per ${table.name}: importate ${counts[table.name]}, sorgente ${result.rows[0].count}`);
            }
        }

        console.log('Migrazione PostgreSQL -> SQLite completata.');
        for (const [table, count] of Object.entries(counts)) {
            console.log(`  ${table}: ${count} righe`);
        }
        console.log(`Database SQLite: ${dbFile}`);
    } finally {
        await pg.end();
    }
}

main().catch((error) => {
    console.error('Migrazione non riuscita:', error.message);
    process.exitCode = 1;
});
