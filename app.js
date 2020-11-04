if(NODEENV = "production") {
    require('dotenv').config();
}
const express = require('express');

const app = express();

const apiRoute = require('./routes/user');
/**
 *  Bring in neccessary middlewares
 */
 app.use(express.json());
 app.use(express.urlencoded({extended : false}));


app.use('/api/v1', apiRoute);

app.get('/', (req,res) => {
    res.send("WEB APP UNDER CONSTRUCTION- VISIT THE API PAGE");
});
app.listen(7000, () => console.log("-----------------Server running on 7000-------------------"));