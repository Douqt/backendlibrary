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
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

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
  // Run soft delete migrations to existing tables
  await runMigration('./migrations/add_soft_delete_to_books.sql');
  await runMigration('./migrations/add_soft_delete_to_loans.sql');
}

main().catch(console.error);
