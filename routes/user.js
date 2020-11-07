const router = require("express").Router();
const  { signup, signin, logout, delete_author, update_author_email, create_article, get_all_posts } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/create_post", verify, create_article);
router.post('/delete_author',verify, delete_author);
router.post('/logout', verify, logout);
router.patch('/update_email', verify, update_author_email);
router.get('/allposts', get_all_posts);

module.exports = router;