const router = require('express').Router();
const { get_all_articles, get_one_article, delete_one_article, create_article, update_one_article, get_author_articles, delete_all_articles, get_all_article_id} = require('../controllers/articles');
const { verify } = require('../middlewares/verify_auth');

router.get('/', get_all_articles);
router.get('/articleids', get_all_article_id);
router.get('/:authorid', get_author_articles);
router.get('/:articleid', get_one_article);
router.delete('/delete/:articleid',verify, delete_one_article);
router.delete('/delete',verify, delete_all_articles);
router.patch('/update/:articleid',verify, update_one_article);
router.post("/create", verify, create_article);

module.exports = router;