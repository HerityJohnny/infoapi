const jwt  = require("jsonwebtoken");

/**
 * @async check for jwt token
 */

 exports.verify = async (req,res,next) => {
     try{
     const token = await req.headers.authorization || req.cookies.author;

     /**
      * decode token
      */
     const decoded = await jwt.verify(token, process.env.JWT_KEY);
     /**
      * Assign token to req.user
      */
     req.user = decoded;
     next();
     } catch(err) {
        res.status(401).json({
            "message" : "You're unauthorized on this route, login or please create an account @ http://localhost:7000/signup"
        })
     }
 }

