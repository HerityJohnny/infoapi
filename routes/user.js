const router = require("express").Router();
const  { signup, signin, logout, delete_author } = require("../controllers/user");
const { verify } = require('../middlewares/verify_auth');
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/create_post", verify, (req,res) => {
    res.status(200).json({
        "message" : "post created"
    })
})
router.post('/delete_author',verify, delete_author);
router.post('/logout', verify, logout);

module.exports = router;





