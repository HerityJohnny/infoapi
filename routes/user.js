const router = require("express").Router();
const  { create_data } = require("../controllers/user");

router.post("/create",create_data);

module.exports = router;