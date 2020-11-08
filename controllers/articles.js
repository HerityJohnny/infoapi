  const { generateuuid } = require('../utils/uuid_generator');
  const  { db } = require('../configs/db');
  const Joi = require("joi");

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

    /**
     * Update a single article
     */

    exports.update_one_article_title = async (req,res) => {
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

          const { title } = req.body;
         /**
          * Query database to update data
          */
         db.query('UPDATE Articles SET title = $1 WHERE authorid = $2 AND articleid = $3 RETURNING articleid',[title,id,articleid])
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
                     "message" : "Article title updated successfully",
                     "article_id" : article.rows[0].articleid
                 });
             }
         })
         .catch(err => {
             res.status(400).json({
                 "success" : false,
                 "message" : err.message
             });
             console.log(err)
         })
    }