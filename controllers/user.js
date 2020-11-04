const { db } = require("../configs/db");
const { uuid } = require("uuidv4");
/**
 * @query data from db
 */
exports.create_data = (req,res) => {
    /**
     * get data from req.body
     */
    const {} = req.body;

     db.query("INSERT INTO info_api ()")
    .then(resp => {
        res.status(200).json({
            "Status" : "Success",
            "Code" : 200,
            "data" : resp.rows[0]
        });
    })
    .catch(err => {
        res.status(400).json({
            "Error": err.stack
        });
        console.log(err.message);
    });
};