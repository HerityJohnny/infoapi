const { db } = require("../configs/db");
const { generateuuid } = require('../utils/uuid_generator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require("joi");

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
     let date, month, year;
     date = new Date().getDate();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const created_at = `${year}-${month}-${date}`;


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

         db.query("INSERT INTO Authors (authorid,firstname,lastname,email,username,password,skills,bio,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
        [authorId,firstname,lastname,email,username,hashpassword,skills,bio,created_at])
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
 * Update author Email
 */

 exports.update_author_email = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

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
    }
 }  

/**
 * Update author Firstname
 */

 exports.update_author_firstname = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
        firstname : Joi.string().trim().alphanum().required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { firstname } = value;
        db.query('UPDATE Authors SET firstname  = $1, updated_at = $2 WHERE authorid = $3 RETURNING firstname, updated_at', [firstname,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated Firstname Successfully`,
             "Updated data" : resp.rows[0].firstname,
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
    }
 }  


 /**
 * Update author Lastname
 */

 exports.update_author_lastname = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
        lastname : Joi.string().trim().alphanum().required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { lastname } = value;
        db.query('UPDATE Authors SET lastname  = $1, updated_at = $2 WHERE authorid = $3 RETURNING lastname, updated_at', [lastname,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated Lastname Successfully`,
             "Updated data" : resp.rows[0].lastname,
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
    }
 }  

  /**
 * Update author username
 */

 exports.update_author_username = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
            username: Joi.string().trim().alphanum().min(3).max(30).required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { username } = value;
        db.query('UPDATE Authors SET username  = $1, updated_at = $2 WHERE authorid = $3 RETURNING username, updated_at', [username,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated Username Successfully`,
             "Updated data" : resp.rows[0].username,
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
            "error" : error
        });
    }
 }  


  /**
 * Update author Skills
 */

 exports.update_author_skill = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
                skills: Joi.string().trim().required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { skills } = value;
        db.query('UPDATE Authors SET skills  = $1, updated_at = $2 WHERE authorid = $3 RETURNING skills, updated_at', [skills,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated Skills Successfully`,
             "Updated data" : resp.rows[0].skills,
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
    }
 }  

/**
 * Update author Password
 */

 exports.update_author_password = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
            olderpassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}')).required(),
            newpassword: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}')).required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { olderpassword, newpassword } = value;
        //Check if older password matches the one in the database
        db.query('SELECT password FROM Authors')
        .then(pass => {
            //check if password match using bcrypt module
            bcrypt.compare(olderpassword, pass.rows[0].password)
            .then(passw => {
                if(!passw) {
                    res.status(400).json({
                        "success" : false,
                        "message" : "Older password is incorrect"
                    });
                } else {
                    //Password matches - then update it with new password and hash it before saving
                    bcrypt.genSalt(10, (err,salt) => {
                        bcrypt.hash(newpassword, salt)
                        .then(newpass => {
                            //save the hashed password into database
                            db.query('UPDATE Authors SET password = $1, updated_at = $2 WHERE authorid = $3  RETURNING updated_at',[newpass,updated_at,id])
                            .then(data => {
                                res.status(200).json({
                                    "success" : true,
                                    "message": "Password updated successfully",
                                    "updated_at" : data.rows[0].updated_at,
                                    "updated" : data.rowCount
                                });
                            })
                            .catch(err => {
                                res.status(400).json({
                                    "success" : false,
                                    "message" : err.message
                                });
                            });
                        })
                        .catch(err => {
                            res.status(400).json({
                                "success" : false,
                                "message" : err.message
                            });
                        });
                    });
                }
            })
            .catch(err => {
                res.status(400).json({
                    'success' : false,
                    "message" : err.message
                });
            });
        })
        .catch(err => {
            res.status(400).json({
                "success" : false,
                "message" : err.message
            });
        });
    } else {
        res.status(400).json({
            "success": false,
            "message" : "Data is not valid",
            "error" : error.details[0].message
        });
    }
 }  
 
 /**
 * Update author Bio
 */

 exports.update_author_bio = async (req,res) => {

    //Store Date when account was updated
     //few setups
     let date, month, year;
     date = new Date().getDay();
     month = new Date().getMonth();
     year = new Date().getFullYear();
     const updated_at = `${year}-${month}-${date}`;

     /**
      * Get author id from req object
      */
     const { id } = req.user;
    /**
     * Validate data with joi
     */
    const ValidString = Joi.object().keys({
            bio: Joi.string().trim().min(5).max(300).required()
    })
    const {error , value} = await ValidString.validate(req.body);
    if(!error) {
        /**
      * Get data to update from value
      */
        const { bio } = value;
        db.query('UPDATE Authors SET bio  = $1, updated_at = $2 WHERE authorid = $3 RETURNING bio, updated_at', [bio,updated_at,id])
        .then(resp => {
            res.status(200).json({
             "success" : true,
             "message" : `Updated Bio Successfully`,
             "Updated data" : resp.rows[0].bio,
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

     //Delete all articles by this author
     db.query('DELETE FROM Articles WHERE authorid = $1', [id])
     .then(resp => {
        //delete was successful then delete author
        db.query('DELETE FROM Authors WHERE authorid = $1',[id])
        .then(author => {
                res.clearCookie("author");
                res.status(200).json({
                    "success": true,
                    "message": "Author delected successfully",
                    "deleted" : author.rowCount
                });
        })
        .catch(err => {
            res.status(400).json({
                "success": false,
                "message" : "An error occured while delecting user " + err.message 
            })
        })
     })
     .catch(err => {
         res.status(400).json({
             "success" : false,
             "message" : err.message
         });
     });
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
 * get all authors ids to query data from articles
 */

 exports.get_all_authors_ids = async (req,res) => {
     /**
      * This query does not need you to be authenticated
      */

      db.query('SELECT authorid FROM Authors')
      .then(ids => {
          res.status(200).json({
              "success" : true,
              "ids" : ids.rows
          });
      })
      .catch(err => {
          res.status(400).json({
              "success" : true,
              "message" : err.message
          });
      })
 }
