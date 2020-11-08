const router = require("express").Router();
const  { signup, signin, logout, delete_author, update_author_email, create_article, delete_one_article, get_one_article, get_all_articles } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/create/article", verify, create_article);
router.delete('/delete/author',verify, delete_author);
router.post('/logout', verify, logout);
router.patch('/update_email', verify, update_author_email);
router.get('/articles', get_all_articles);
router.get('/articles/:articleid', get_one_article);
router.delete('/delete/article/:articleid',verify, delete_one_article);

module.exports = router;