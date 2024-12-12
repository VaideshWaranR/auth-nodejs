const { Pool } = require('pg')
const { user, password, port, database } = require('pg/lib/defaults')

const pool=new Pool({
    user:'postgres',
    password:'123',
    host:'localhost',
    port:5432,
    database:'projects'
});

module.exports={
    query:(text,params)=>pool.query(text,params)
};