const { db } = require("../configs/db");
const { generateuuid } = require('../utils/uuid_generator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require("joi");
// const { updateAuthor } = require("../utils/update_helper");

/**
 * Code for CRUD Operation - Author
 */
/**
 * @query data from db
 */
exports.signup = async (req,res) => {
     /**
      * Schema to validate inputs befor insert into database
      * @tool - Joi
      */
    const Schema = Joi.object().keys({
        firstname: Joi.string().trim().alphanum().required(),
        lastname: Joi.string().trim().alphanum().required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        username: Joi.string().trim().alphanum().min(3).max(30).required(),
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}')).required(),
        skills: Joi.string().trim().required(),
        bio: Joi.string().trim().min(5).max(300).required()
    });


     //Validate data
     const { error, value } = await Schema.validate(req.body);
     if(!error) {

        /**
         * Destructure data from the value object
         */
     const { firstname, lastname, username, email, password, skills, bio } =  value;

     //Store Date of account creation
     //few setups
     let day, month, year;
     day = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const created_at = `${year}-${month}-${day}`;


     /**
      * generate authorID using the generateuuid()
      */

      const authorId = generateuuid();

      // Check if user eith that email exist already

      db.query("SELECT * FROM Authors WHERE email = $1", [email])
      .then(author => {
          if(author.rowCount >= 1) {
              res.status(401).json({
                  "success" : false,
                  "message" : "User already exist, please login instead"
              })
          } else {
      /**
      * Hash data using bcrypt
      */


      bcrypt.genSalt(10,(err,salt) => {
            bcrypt.hash(password, salt, (err,hash) => {
            let hashpassword = hash;
        /**
         * Insert data into database after verifying user dosent exist
         */

         db.query("INSERT INTO Authors (authorid,firstname,lastname,email,username,password,skills,bio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
        [authorId,firstname,lastname,email,username,hashpassword,skills,bio])
        .then(author => {
                res.status(200).json({
                "success" : true,
                "message" :"Author created successfully",
                "authorid" : author.rows[0].authorid
            });
        })
        .catch(err => {
            res.status(400).json({
            "success" : false,
                "message" :"Author creation failed",
                "error" : err.code
            });
         });
      })
    });
          }
      })
      .catch(err => {
          res.status(400).json({
              "success": false,
              "message" : "An Error Occured When finding user",
              "Error" : error.details[0].message
          })
      })
     } else {
          res.status(400).json({
             "success" : false,
             "message" :"Invalid credentials provided, check your credentials and correct it",
             "error" : error.details[0].message
         })
     }
    }



    /**
     * User signin api functionality
     * Access data from authors.rows[0]
     */
    exports.signin = async(req,res) => {
     /**
      * Create a joi schema to validate input credentials
      */
     const signin_Schema = Joi.object().keys({
        email : Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string().trim().pattern(new RegExp('^[a-zA-Z0-9]{8,30}')).required()
     });

     //Validate using Joi.validate
     //destructure objects from the schema
     const { error, value } = await signin_Schema.validate(req.body);

     if(!error) {
         //authorize user

         /**
          * Destructure user from the value object 
          */
         const { email, password } = value;

         /**
          * Check if user exits
          */
          
          db.query("SELECT * FROM Authors WHERE email = $1", [email])
          .then(author => {
              if(author.rowCount <= 0) {
                  res.status(401).json({
                      "success" : false,
                      "message": "No a user wth that email"
                  })
              } else {
                  /**
                   * User found then compare password
                   */
                  bcrypt.compare(password, author.rows[0].password)
                  .then(pass => {
                      if(!pass) {
                          res.status(400).json({
                              "success" : false,
                              "message" : "Password incorrect"
                          })
                      } else {
                          /**
                           * Sign user with json web token
                           */
                          jwt.sign({id : author.rows[0].authorid, username : author.rows[0].username}, process.env.JWT_KEY, {expiresIn : 604800000}, (err,token) => {
                              /**
                               * store token to cookie
                               */
                              res.cookie("author", token, {httpOnly: true, maxAge : 604800000});
                              res.status(200).json({
                                  "success" : true,
                                  "message" : "login successful you can now create a post"
                              })
                          })
                      }
                  })
                  .catch(err => {
                      res.status(400).json({
                          "success" : false,
                          "message" : "An error occured when validating password",
                          "error" : err.error
                      })
                  });
              }
          })
          .catch(err => {
              res.status(400).json({
                  "success" : false,
                  "message" : 'an error occured',
                  "Error" : err.code
              })
          });
     } else {
        //send back eror message - Invalid credentials
        res.status(400).json({
            "success" : false,
            "message" : "Invalid credentials - check email or password",
            "error" : error.details[0].message
        })
     }
}


/**
 * Update author
 */

 exports.update_author_email = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let day, month, year;
     day = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${day}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidEmail = Joi.object().keys({
        email : Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required()
    })
    const {error , value} = await ValidEmail.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { email } = value;
        db.query('UPDATE Authors SET email  = $1, updated_at = $2 WHERE authorid = $3 RETURNING email, updated_at', [email,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated email Successfully`,
             "Updated data" : resp.rows[0].email,
             "Updated at" : resp.rows[0].updated_at
         });
        })
        .catch(err => {
             res.status(400).json({
             "success" : false,
             "message" : "An Error Occured when Updating",
             "error" : err.message
         })
        });

    } else {
        res.status(400).json({
            "success": false,
            "message" : "Data is not valid",
            "error" : error.details[0].message
        });
        console.log(error)
    }
 }  

/**
 * 
 * @param {Delete} req 
 * @param {json} res 
 */
 
 exports.delete_author = async (req,res) => {
     /**
      * get User from req.user obj
      */
     const { id } = req.user;

     db.query("DELETE FROM Authors WHERE authorid = $1",[id])
     .then(resp => {
         res.clearCookie("author");
         res.status(200).json({
             "success" : true,
             "message" : "User Deleted Successfully",
             "deleted": resp.rowCount
         })
     })
     .catch(err => {
         res.status(400).json({
             "success" : false,
             "message" : "An Error occured while delecting author"
         })
     })
 }
/**
  * Logout user
  */

  exports.logout = async (req,res) => {
      res.clearCookie("author");
      res.status(200).json({
        message: "logout successful"
    })
  }


  /**
   * Code for crud operation for Articles
   */

   exports.create_article = async (req,res) => {
        //Store Date of Article creation
        //few setups -- bugs here
        let day, month, year;
        day = new Date().getDay();
        month = new Date().getMonth();
        year = new Date().getFullYear();
        const created_at = `${year}-${month}-${day}`;
        console.log(created_at)
       /**
        * First create a schema to validate data coming in
        * Data Expected : title, body
        */
       const ArticleSchema = Joi.object().keys({
           title: Joi.string().min(5).max(255).required(),
           body: Joi.string().min(20).max(100000).required()
       });

       /**
        * Validate Data 
        */
       const { error, value } = await ArticleSchema.validate(req.body);

       if(!error) {
           const { title, body } = value;
           /**
            * generate articleid using generateuuid
            */
           const articleid = generateuuid();

           const { id, username } = req.user;
           /**
            * Insert data into queries
            */
           db.query('INSERT INTO Articles (title,body,articleid,authorid,username) VALUES ($1,$2,$3,$4,$5) RETURNING articleid, username', [title,body,articleid,id,username])
           .then(article => {
               res.status(200).json({
                   "success" : true,
                   "message": "Article created successfully",
                   "articleid": article.rows[0].articleid,
                   "Author username" : article.rows[0].username
               });
           })
           .catch(err => {
               res.status(400).json({
                   "success" : false,
                   "message" : "An error occured",
                   "error": err.message
               });
           });
       } else {
           res.status(400).json({
               "success" : false,
               "message" : error.details[0].message
           });
       }

   }

   /**
    * Get all articles
    */
   exports.get_all_articles = async (req,res) => {
       /**
        * You dont have to be authenticated for you to get all
        */
       db.query('SELECT body, title, username FROM Articles')
       .then(articles => {
           if(articles.rowCount <= 0) {
               res.status(200).json({
                   "message" : "No article found",
                   "data" : articles.rowCount
               });
           }
            res.status(200).json({
                "data": articles.rows
            });
       })
       .catch(err => {
           res.status(400).json({
               "success" : false,
               "message" : err.message
           })
       })
   }

   /**
    * Delete one article
    * You need to be authenticated and authorize to delete your posts
    */

    exports.delete_one_article = async (req,res) => {
        /**
         * Get author id from req object
         */
        const { id } = req.user;

        /**
         * get article id from the req.params
         */
        const { articleid } = req.params;

        /**
         * Run db query to delete articles
         */
        db.query('DELETE FROM Articles WHERE articleid = $1 AND authorid = $2', [articleid,id])
        .then(article => {
            if(articles.rowCount <= 0) {
                res.status(200).json({
                    "message": "Article Not Found"
                })
            }
            res.status(200).json({
                "success" : true,
                "message" : "Article Deleted",
                "deleted" : article.rowCount
            })
        })
        .catch(err => {
            res.status(400).json({
                "success": false,
                "errorMessage" : err.message
            })
        })
    }


    /**
     * Getting a single article by id
     */
    exports.get_one_article = async (req,res) => {
        /**
         * Get articleid from the request param
         */
        const { articleid } = req.params;

        /**
         * Run db query to get a single article
         */

         db.query('SELECT title, body FROM Articles WHERE articleid = $1', [articleid])
         .then(article => {
             if(article.rowCount <= 0) {
                 res.status(404).json({
                     "success" : false,
                     "message" : "NOT FOUND",
                     "data" : article.rowCount
                 })
             } else {
                 res.status(200).json({
                     "success" : true,
                     "message" : "Article Found",
                     "data" : article.rows[0]
                 })
             }
         })
         .catch(err => {
             res.status(400).json({
                 "success" : false,
                 "message" : err.message
             })
         })
    }