import sqlite3 from 'sqlite3'

// [Node.js SQLite Schema & Data - A ShareGPT conversation](https://sharegpt.com/c/12ezu5X)
// const sqlite3 = require('sqlite3').verbose();

// Create a new SQLite database connection
const db = new sqlite3.Database('./test.db'); // You can also specify a file path for a persistent database

// Create the schema
db.serialize(() => {
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)');
});

// Insert data into the table
db.serialize(() => {
  const insertStmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  insertStmt.run('John Doe', 'john@example.com');
  insertStmt.run('Jane Smith', 'jane@example.com');
  insertStmt.finalize();
});

// Query the data
db.serialize(() => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      rows.forEach(row => {
        console.log(`User ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
      });
    }
  });
});

// Close the database connection
db.close();
