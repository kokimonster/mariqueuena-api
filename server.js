// server creation and db connection
const express = require('express');
const mysql = require('mysql');

// allows us to control the app's cross origin resource sharing
const cors = require('cors');
const bcrypt = require('bcrypt');
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

app.post('/login', async (req, res) => {
    const sql = "SELECT * FROM users WHERE `email` = ?";
    const values = [req.body.email];

    db.query(sql, values, async (err, data) => {
      if (err) {
        return res.json("Login Failed");
      }
      
      console.log("Data retrieved3:", data);
      if (data.length > 0) {
        const storedHashedPassword = data[0].password.trim();

        const passwordMatch = await bcrypt.compare(req.body.password.trim(), storedHashedPassword.trim());

        if (passwordMatch) {
          return res.json("Success");
        } else {
          return res.json("Failed");
        }
      } else {
        return res.json("Failed");
      }
    });
  });

app.post('/registrationPage', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const sql = "INSERT INTO users (`fname`, `lname`, `email`, `password`) VALUES (?, ?, ?, ?)";
      const values = [req.body.fName, req.body.lName, req.body.email, hashedPassword];
  
      db.query(sql, values, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
      });
    } catch (error) {
      console.error(error);
      return res.json(error);
    }
  });

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