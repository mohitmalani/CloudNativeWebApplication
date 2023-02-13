const Pool = require('pg').Pool;
const pool = new Pool({
host: "localhost",
user: "postgres",
port: "5432",
password: "Myneu@123",
database: "postgres"
})



module.exports = pool;