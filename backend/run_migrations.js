const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(sqlFilePath) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Handle DELIMITER changes for triggers
    let delimiter = ';';
    const statements = [];
    let currentStatement = '';

    const lines = sql.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line.toUpperCase().startsWith('DELIMITER ')) {
        delimiter = line.split(' ')[1];
      } else if (line === delimiter) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      } else {
        currentStatement += line + '\n';
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    for (let statement of statements) {
      statement = statement.trim();
      if (statement && !statement.includes('CREATE DATABASE') && !statement.includes('USE library_db')) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.query(statement);
      }
    }
    console.log(`Migration ${sqlFilePath} completed successfully`);
  } catch (error) {
    console.error(`Error in migration ${sqlFilePath}:`, error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  const migrationsDir = './migrations';
  const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));

  console.log('Running migrations...');
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Running migration: ${file}`);
    await runMigration(filePath);
  }
  console.log('All migrations completed!');
}

main().catch(console.error);
