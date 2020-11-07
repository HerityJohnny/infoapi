/***
 * Helper function to be used for updating authors
 */

const { db }= require("../configs/db");

//Store Date when account was updated
     //few setups
     let day, month, year;
     day = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${day}`;

 exports.updateAuthor = async(table,column,value,authorid) => {
      db.query(`UPDATE ${table} SET ${column}  = $1, updated_at = $2 WHERE authorid = $3 RETURNING ${column}, updated_at`, [value,updated_at,authorid])
     .then(resp => {
         res.status(200).json({
             "success" : true,
             "message" : `Updated ${column} Successfully`,
             "Updated data" : `${resp.rows[0]}.${column}`,
             "Updated at" : resp.rows[0].updated_at
         })
        
        return;
     })
     .catch(err => {
         res.status(400).json({
             "success" : false,
             "message" : "An Error Occured when Updating",
             "error" : err.message
         })
     })
     return
 }

 