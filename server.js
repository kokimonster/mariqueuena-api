// server creation and db connection
const express = require('express');
const mysql = require('mysql');

// allows us to control the app's cross origin resource sharing
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (re,res)=> {
    return res.json("from backend");
})

// db connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'mariqueuena'
})

// app.get ('/users', (req,res)=>{
//     const sql= "SELECT * FROM users";
//     db.query(sql, (err,data)=> {
//         if(err) return res.json(err);
//         return res.json(data);
//     })
// })

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

app.post('/registrationPage', (req, res) =>{
    const sql = "INSERT INTO users (`fname`, `lname`, `email`, `password`) VALUES (?)";
    const values = [
        req.body.fName,
        req.body.lName,
        req.body.email,
        req.body.password,
    ]
    db.query(sql, [values], (err, data) =>{
        if(err) return res.json(err);
        return res.json(data);
    })
})

// app.post('/register', (req, res)=> {
//     const firstName = req.body.firstName;
//     const lastName = req.body.lastName;
//     const email = req.body.email;
//     const password = req.body.password;

//     db.query(
//         "INSERT INTO users (fname, lname, email, password) VALUES (?,?,?,?)", 
//         [firstName, lastName, email, password], 
//         (err, result) => {
//             console.log(err);
//         }
//     );
// });

app.listen(3031, ()=>{
    console.log("listening");
})