// server creation and db connection
const express = require('express');
const mysql = require('mysql');

// allows us to control the app's cross origin resource sharing
const cors = require('cors');

const app = express();

app.use(cors())

// db connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'mariqueuena'
})

app.post('/users', (req, res) =>{
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    const values = [
        req.body.email,
        req.body.password
    ]
    db.query(sql, [values], (err, data) =>{
        if(err) return res.json("Login Failed");
        return res.json(data);
    })
})

app.listen(8081, ()=>{
    console.log("listening");
})