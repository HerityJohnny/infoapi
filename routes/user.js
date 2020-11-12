const router = require("express").Router();
const  { signup, signin, logout, delete_author, update_author_email, get_all_authors_ids, update_author_firstname, update_author_lastname } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.get("/authorids", get_all_authors_ids);
router.post("/signin", signin);
router.delete('/delete',verify, delete_author);
router.post('/logout', verify, logout);
router.patch('/update/email', verify, update_author_email);
router.patch('/update/firstname', verify, update_author_firstname);
router.patch('/update/lastname', verify, update_author_lastname);

module.exports = router;