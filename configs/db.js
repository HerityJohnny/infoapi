/***
 *  @params Instanciate the pool library from pg 
 */

 const { Pool } = require("pg");

 //Instanciate the pool

 const poolConnection  = new Pool({
     user: process.env.DBUSER,
     password: process.env.DBPASSWORD,
     database: process.env.DBNAME,
     host: process.env.LOCALHOST,
     port: process.env.DBPORT
 }); 

 //EXPORT CONFIG OUT
 module.exports = {
     db: poolConnection
 };