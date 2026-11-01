'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cammini-sqlite-'));
process.env.DB_FILE = path.join(directory, 'test.sqlite');
const { query, withTransaction, initSchema, closePool } = require('./db.cjs');

after(() => {
    closePool();
    fs.rmSync(directory, { recursive: true, force: true });
});

test('initializes SQLite tables and supports PostgreSQL-style parameters and JSON casts', () => {
    query(`
        CREATE TABLE tracks (
            id TEXT PRIMARY KEY,
            name TEXT,
            coordinates TEXT,
            elevation TEXT,
            photo_folder_path TEXT,
            created_at TEXT
        )
    `);
    initSchema();
    assert.ok(query('PRAGMA table_info(tracks)').rows.some((column) => column.name === 'waypoints'));

    const inserted = query(
        'INSERT INTO tracks (id, name, coordinates) VALUES ($1, $2, $3::jsonb) RETURNING id',
        ['track-1', 'Sentiero', '[[45.1, 7.2]]']
    );

    assert.deepEqual(inserted.rows, [{ id: 'track-1' }]);
    assert.equal(inserted.rowCount, 1);
    assert.deepEqual(query('SELECT coordinates FROM tracks WHERE id = $1', ['track-1']).rows, [
        { coordinates: '[[45.1, 7.2]]' }
    ]);
});

test('reports affected rows and rolls back failed async transactions', async () => {
    const update = query('UPDATE tracks SET name = $1 WHERE id = $2', ['Nuovo nome', 'track-1']);
    assert.equal(update.rowCount, 1);

    await assert.rejects(
        withTransaction(async ({ query: transactionQuery }) => {
            await transactionQuery(
                'INSERT INTO tracks (id, name) VALUES ($1, $2)',
                ['track-2', 'Temporaneo']
            );
            throw new Error('transaction failure');
        }),
        /transaction failure/
    );

    assert.equal(query('SELECT id FROM tracks WHERE id = $1', ['track-2']).rowCount, 0);
    assert.deepEqual(query('SELECT name FROM tracks WHERE id = $1', ['track-1']).rows, [
        { name: 'Nuovo nome' }
    ]);
});
