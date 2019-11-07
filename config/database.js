// POSTGRE POOL
var { Pool } = require('pg');

module.exports = () => {
    // POOL CONFIG
    let pool = new Pool({
        user: 'hjfnvtxbyujcbh',
        password: 'b8ec850fecede6b7ac939f9f4c11b9c1f7cc3055ed32650bff43b63692b05d30',
        host: 'ec2-54-235-86-101.compute-1.amazonaws.com',
        port: 5432,
        database: 'd94lumo4almjc2',
        max: 10,
        idleTimeoutMillis: 30000,
        ssl: true
    });

    return pool;
};