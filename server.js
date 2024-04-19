// server creation and db connection
const express = require('express');
const mysql = require('mysql');

// allows us to control the app's cross origin resource sharing
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express();
const multer = require('multer');
const path = require('path');

const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: false}));

const generateJWTSecret = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_';
  const length = 64;
  let jwtSecret = '';
  
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      jwtSecret += characters[randomIndex];
  }
  
  return jwtSecret;
};


const storage = multer.diskStorage({
  destination: (req, file, db) => {
    db(null, 'public/images')
  },
  filename: (req, file, db) => {
    // Access values.idType from the request body
    const idType = req.body.idType;
    // Generate the filename using idType and current timestamp
    const filename = idType + "_" + Date.now() + path.extname(file.originalname);

    db(null, filename);
  }
})

const upload = multer({ storage: storage }); // Configure Multer with the storage option


app.get('/', (re, res) => {
  return res.json("from backend");
})

// db connection
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: 'mariqueuena'
})

app.post('/login', async (req, res) => {
  const sql = "SELECT * FROM users_table WHERE `email` = ?";
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

app.get('/users', async (req, res) => {
  const sql = "SELECT * FROM users_table WHERE LOWER(fname) = '%admin%'";
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    // Assuming the user information is returned as an array with the first user being the logged-in user
    console.log('Data from the database:', data);
    const user = data.length > 0 ? data[0] : null;
    return res.json(user);
  });
});

app.post('/upload', upload.single('idImage'), (req, res) => {
  console.log("upload ", req.file);
  const generatedFilename = req.file.filename;

  // Get the email of the user based on the provided user_id
  const userEmail = req.body.email;

  // Insert into id_table with user_email
  const query = "INSERT INTO id_table (user_email, idType, idNumber, filename, filepath) VALUES (?, ?, ?, ?, ?)";
  const uploadValues = [userEmail, req.body.idType, req.body.idNumber, generatedFilename, req.file.path];

  db.query(query, uploadValues, (uploadErr, uploadData) => {
    if (uploadErr) {
      console.error(uploadErr);
      return res.json(uploadErr);
    }

    return res.json(uploadData);
  });
});

app.post('/registrationPage', async (req, res) => {
  try {
    // Check if the email already exists in the database
    const checkEmailQuery = "SELECT * FROM users_table WHERE `email` = ?";
    const checkEmailValues = [req.body.email];

    db.query(checkEmailQuery, checkEmailValues, async (checkEmailErr, checkEmailData) => {
      if (checkEmailErr) {
        console.error(checkEmailErr);
        return res.json(checkEmailErr);
      }

      if (checkEmailData.length > 0) {
        // Email already exists, return an error
        return res.json({ error: "Email is already registered" });
      }

      // If the email is not registered, proceed with registration
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const query = 'INSERT INTO users_table (fname, minitial, lname, dateofbirth, mnumber, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
      const registrationValues = [req.body.fName,req.body.mInitial, req.body.lName, req.body.dateOfBirth, req.body.mNumber, req.body.email, hashedPassword];
      console.log(registrationValues);

      db.query(query, registrationValues, (registrationErr, registrationData) => {
        if (registrationErr) {
          console.error(registrationErr);
          return res.json(registrationErr);
        }

        return res.json(registrationData);
      });
    });
  } catch (error) {
    console.error(error);
    return res.json(error);
  }
});

app.post("/forgot-password", async (req, res) => {
  const sql = "SELECT * FROM users_table WHERE `email` = ?";
  const email = req.body.email;

  try {
    db.query(sql, email, async (err, data) => {
      if (err) {
        return res.json("Error occurred while querying the database");
      } else {
        const user = data.length > 0 ? data[0] : null;
        if (!user) {
          return res.json("Email doesn't exist");
        }

        // Generate token and send email
        const secret = generateJWTSecret + user.password;
        const token = jwt.sign({ email: user.email, id: user._id }, secret, {
          expiresIn: '5m',
        });
        const link = `http://localhost:3031/reset-password/${user.id}/${token}`;
        console.log(link);
        // Send email with the reset password link

        return res.json("Success");
      }
    });
  } catch (error) {
    console.error(error);
    return res.json("An error occurred while processing your request");
  }
});

app.get('/reset-password/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  const sql = "SELECT * FROM users_table WHERE `id` = ?";
  
  db.query(sql, id, async (err, data) => {
    if (err) {
      return res.render("index", { status: "Error occurred while querying the database" });
    } else {
      const user = data.length > 0 ? data[0] : null;
      if (!user) {
        return res.render("index", { status: "User with the provided ID doesn't exist" });
      } else {
        const secret = generateJWTSecret + user.password;
        try {
          const verify = jwt.verify(token, secret);
          res.render("index", { email: verify.email, status: "Not Verified" });
        } catch (error) {
          return res.render("index", { status: "Token verification failed" });
        }
      }
    }
  });
});

app.post('/reset-password/:id/:token', async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;
  
  const sql = "SELECT * FROM users_table WHERE `id` = ?";
  db.query(sql, id, async (err, data) => {
    if (err) {
      return res.render("index", { status: "Error occurred while querying the database" });
    } else {
      const user = data.length > 0 ? data[0] : null;
      if (!user) {
        return res.render("index", { status: "User with the provided ID doesn't exist" });
      } else {
        const secret = generateJWTSecret + user.password;
        try {
          const verify = jwt.verify(token, secret);
          const encryptedPassword = await bcrypt.hash(password, 10);
          const sql = "UPDATE users_table SET `password` = ? WHERE `id` = ?";
          db.query(sql, [encryptedPassword, id], async (err, data) => {
            if (err) {
              return res.render("index", { status: "Error occurred while updating the password" });
            }
            
            res.redirect("http://localhost:3000/");
          });
        } catch (error) {
          console.log(error);
          res.render("index", { status: "Something Went Wrong" });
        }
      }
    }
  });
});


const server = app.listen(3031, () => {
  console.log('Server is running on port 3031');
}); 