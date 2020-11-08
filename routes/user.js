const router = require("express").Router();
const  { signup, signin, logout, delete_author, update_author_email, create_article, get_all_posts, delete_one_article } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/create_post", verify, create_article);
router.delete('/delete_author',verify, delete_author);
router.post('/logout', verify, logout);
router.patch('/update_email', verify, update_author_email);
router.get('/allposts', get_all_posts);
router.delete('/delete_article/:articleid',verify, delete_one_article);

module.exports = router;