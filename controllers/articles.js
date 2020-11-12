  const { generateuuid } = require('../utils/uuid_generator');
  const  { db } = require('../configs/db');
  const Joi = require("joi");

  /**
   * Code for crud operation for Articles
   */

   exports.create_article = async (req,res) => {
        //Store Date of Article creation
        //few setups -- bugs here
        let date, month, year;
        date = new Date().getDate();
        month = new Date().getMonth();
        year = new Date().getFullYear();
        const created_at = `${year}-${month}-${date}`;
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
           db.query('INSERT INTO Articles (title,body,articleid,authorid,username,created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING articleid, username, created_at', [title,body,articleid,id,username,created_at])
           .then(article => {
               res.status(200).json({
                   "success" : true,
                   "message": "Article created successfully",
                   "articleid": article.rows[0].articleid,
                   "Author username" : article.rows[0].username,
                   "created_at" : article.rows[0].created_at
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

    /**
     * Update a single article by title
     */

    exports.update_one_article = async (req,res) => {

        //Store Date of Article creation
        //few setups -- bugs here
        let date, month, year;
        date = new Date().getDate();
        month = new Date().getMonth();
        year = new Date().getFullYear();
        const updated_at = `${year}-${month}-${date}`;
        /**
         * Get the article id from the req.params object
         */

         const { articleid } = req.params;

         /**
          * get authorid from req.user object
          */
         const { id } = req.user;
         /**
          * Get title from the req.body
          */

          const { title, body } = req.body;
         /**
          * Query database to update data
          */
         db.query('UPDATE Articles SET title = $1, body = $2,  updated_at = $3 WHERE authorid = $4 AND articleid = $5 RETURNING articleid',[title,body,updated_at,id,articleid])
         .then(article => {
             if(article.rowCount <= 0) {
                 res.status(404).json({
                     "success" : false,
                     "message" : "Article is not found",
                     "data" : article.rowCount
                 });
             } else {
                 res.status(200).json({
                     "success" : true,
                     "message" : "Article was updated successfully",
                     "article_id" : article.rows[0].articleid
                 });
             }
         })
         .catch(err => {
             res.status(400).json({
                 "success" : false,
                 "message" : err.message
             });
         })
    }

    /**
     * Get all articles by a single author
     */
    exports.get_author_articles = async (req,res) => {
        /**
         * Get id from req.params
         */
        const { authorid } = req.params;

        db.query('SELECT title, body, username FROM Articles WHERE authorid = $1', [authorid])
        .then(articles => {
            if(articles.rowCount <= 0) {
                res.status(404).json({
                    "success" : false,
                    "message" : "These Author has not written an articles"
                });
            } else {
                res.status(200).json({
                    "success" : true,
                    "data" : articles.rows
                });
            }
        })
        .catch(err => {
            res.status(400).json({
                "success" : false,
                "message" : err.message
            });
        });
    }

    /**
     * Delete all author articles
     * Require author to be authenticated in order to perform action 
     */

     exports.delete_all_articles = async (req,res) => {
         /**
          * Get authorid from req.user
          */
         const { id } = req.user;

         db.query('DELETE FROM Articles WHERE authorid = $1', [id])
         .then(deleted => {
             if(deleted.rowCount <= 0) {
                 res.status(404).json({
                     "success" : false,
                     "message" : "No articles avaliable to be delected"
                 });
             } else {
                 res.status(200).json({
                     "success" : true,
                     "delected" : deleted.rowCount
                 });
             }
         })
         .catch(err => {
             res.status(400).json({
                 "success" : false,
                 "message" : err.message
             });
         });
     }

     /**
      * Get all articles id to be used to query the api
      */
     exports.get_all_article_id = async (req,res) => {
         /**
          * Querying this endpoint does not require user to be authenticated
          */

          db.query('SELECT articleid FROM Articles')
          .then(ids => {
              res.status(200).json({
                  "success" : true,
                  "ids" : ids.rows
              })
          })
          .catch(err => {
              res.status(400).json({
                  "success" : false,
                  "message" : err.message
              });
          });
     }