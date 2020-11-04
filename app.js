const express = require('express');

const app = express();

app.get('/', (req,res) => {
    res.send("WEB APP UNDER CONSTRUCTION");
});

app.listen(7000, () => console.log("-----------------Server running on 7000-------------------"));