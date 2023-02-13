const Pool = require('pg').Pool;



const pool = new Pool({
    host: process.env.DB_CONNECTION,
    user: process.env.DB_USERNAME,
    port: process.env.PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});




module.exports = pool;