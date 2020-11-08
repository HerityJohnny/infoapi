const router = require("express").Router();
const  { signup, signin, logout, delete_author, update_author_email } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.post("/signin", signin);
router.delete('/delete',verify, delete_author);
router.post('/logout', verify, logout);
router.patch('/update/email', verify, update_author_email);

module.exports = router;