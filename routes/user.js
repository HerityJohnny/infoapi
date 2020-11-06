const router = require("express").Router();
const  { signup, signin } = require("../controllers/user");

router.post("/signup", signup);
router.post("/signin", signin);

module.exports = router;