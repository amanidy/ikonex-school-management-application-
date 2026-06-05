// I brought in the mysql2 library with promise support
const mysql = require('mysql2/promise');

// loaded environment variables from the .env file
require('dotenv').config();

// created a connection pool so we don’t have to reconnect every time
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,        
  port: process.env.MYSQLPORT,       
  user: process.env.MYSQLUSER,        
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,    
  waitForConnections: true,         
  connectionLimit: 10               
});

// I exported the pool so other files can use it
module.exports = pool;
