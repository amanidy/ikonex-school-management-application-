// I brought in the mysql2 library with promise support
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection()
  .then(conn => {
    console.log(' Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error(' Database connection failed:', err);
  });

module.exports = pool;
