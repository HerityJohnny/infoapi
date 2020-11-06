const { db } = require("../configs/db");
const { generateuuid } = require('../utils/uuid_generator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require("joi");
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
        password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}','i')).required(),
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
     /**
      * Hash data using bcrypt
      */

      bcrypt.genSalt(10,(err,salt) => {
            bcrypt.hash(password, salt, (err,hash) => {
            let hashpassword = hash;
        /**
         * Insert data into database
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
     } else {
          res.status(400).json({
             "success" : false,
             "message" :"Invalid credentials provided, check your credentials and correct it",
             "error" : error.details[0].message
         })
     }
    }