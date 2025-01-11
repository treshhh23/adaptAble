/**
 * dbInitLocal.js
 *
 * Demonstrates creating and reading from a local SQLite database file 
 * without using any HTTP server or Express. 
 * All operations are done locally via Node.js.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1) Define the path for your local database file
// If 'testdata.db' doesn't exist, it will be created automatically
const dbFilePath = path.join(__dirname, 'testdata.db');

// 2) Connect to the local SQLite database file
// If it doesn't exist, a new file named 'testdata.db' is created
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    return console.error('[ERROR] Could not open database:', err.message);
  }
  console.log('[INFO] Connected to local SQLite database:', dbFilePath);
});

// 3) Create a table for storing test data
//   - This example table is named 'test_entries' with sample columns.
export function initDatabase() {
  db.serialize(() => {
    // Example table: user_interactions
    db.run(`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        zoom INTEGER,
        font_type TEXT,
        contrast INTEGER
        
      )
    `);
    //Add more data types later
  });

}

// 4) Insert sample data
export function insertSampleData() {
  // We'll do this in a serialized way to ensure it completes in sequence
  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO user_interactions (user_id, zoom, font_type, contrast) VALUES (?, ?, ?, ?)`);

    // Example: Insert a few rows
    stmt.run(['Alice', 100, "comic sans", 0]);
    stmt.run(['Bob', 100, "arial", 1]);
    stmt.run(['Charlie', 150, "times new roman", 1]);
    stmt.run(["default_user", 100, "arial", 0])

    stmt.finalize();

    console.log('[INFO] Sample data inserted.');
  });
}

// 5) Read and print out the data
export function readData() {
  db.all(`SELECT * FROM user_interactions`, (err, rows) => {
    if (err) {
      return console.error('[ERROR] Could not retrieve data:', err.message);
    }
    console.log('[INFO] Retrieved rows from "user_interactions":');
    console.table(rows);
  });
}

// 6) Close the database connection
export function closeDatabase() {
  db.close((err) => {
    if (err) {
      return console.error('[ERROR] Closing database:', err.message);
    }
    console.log('[INFO] Database connection closed.');
  });
}

// ----------------- MAIN FLOW -----------------
initDatabase();       // Ensure table is created
//insertSampleData();   // Insert sample rows
readData();           // Read & print the rows
closeDatabase();   // Optionally close the DB when you're done.
// If you want the script to exit immediately after reading, 
// you can call closeDatabase() at the end, but it may not show table results 
// before the DB is closed unless you chain it properly.

