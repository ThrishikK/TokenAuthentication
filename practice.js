const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// REGISTERING USER API

app.post("/users", async (request, response) => {
  console.log(request.body);
  const { username, name, password, gender, location } = request.body;
  //   ENCRYPTING PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10);
  //   CHECKING IF THE USER IS ALREADY IN THE TABLE
  const checkUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  console.log(checkUserQuery);
  const userDetails = await db.get(checkUserQuery);
  if (userDetails === undefined) {
    const insertUserQuery = `INSERT INTO 
                                user (username,name,password,gender,location) 
                                VALUES 
                                (
                                    '${username}',
                                    '${name}',
                                    '${hashedPassword}',
                                    '${gender}',
                                    '${location}'
                                    );`;
    const dbResponse = await db.run(insertUserQuery);
    response.send("User Successfully Registerd");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// LOGIN USER API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(request.body);
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const queryResult = await db.get(checkUserQuery);
  if (queryResult === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      queryResult.password
    );
    if (isPasswordMatched === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});