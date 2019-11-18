// POSTGRE POOL
var { Pool } = require('pg');

module.exports = () => {
    // POOL CONFIG
    let pool = new Pool({
        user: 'ocwdsdgsfhaidu',
        password: '0763b7caf177e5a080978e05b8dc87903d372988e6f085b9c0345f90be5f3f82',
        host: 'ec2-107-21-126-201.compute-1.amazonaws.com',
        port: 5432,
        database: 'd6038765kt6q3l',
        max: 10,
        idleTimeoutMillis: 30000,
        ssl: true
    });

    return pool;
};

