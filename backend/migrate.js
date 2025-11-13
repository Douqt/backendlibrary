const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runMigration(sqlFilePath, options = {}) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: options.database || process.env.DB_NAME,
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

async function runSql(sql, database) {
  const connConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  };
  if (database) {
    connConfig.database = database;
  }
  const connection = await mysql.createConnection(connConfig);

  try {
    for (let statement of sql) {
      statement = statement.trim();
      if (statement) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    console.log('SQL executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  // Create the necessary views for reports
  console.log('Creating database views...');
  await runMigration('./create_views.sql');

  console.log('Views created successfully!');
}

main().catch(console.error);
