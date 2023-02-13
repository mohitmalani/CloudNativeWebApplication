const express = require('express');
const pool = require('./database');
const bcrypt = require('bcryptjs');
var uuid = require('uuid');
var fileupload = require('express-fileupload');
var cors = require('cors');

const SDC = require('statsd-client');
const statsClient = new SDC({
    host: 'localhost',
    port: 8125
});

const winston = require('winston');
const logConfiguration = {
    transports: [
        new winston.transports.File({
            level: 'debug',
            // Create the log directory if it does not exist
            filename: 'tester.log'
        })
    ]
};
const logger = winston.createLogger(logConfiguration);

const app = express();
app.use(express.json());
app.use(fileupload());
app.use(cors())
require("dotenv").config();
const AWS = require('aws-sdk');
const fs = require('fs');

const region = 'us-east-1';
const BUCKET_NAME = process.env.BUCKET_NAME;

function decodeBase64(req) {
  const hashedHeader = req.headers.authorization;
  const encoded = hashedHeader.substring(6, hashedHeader.length);
  const base64Val = Buffer.from(encoded, "base64");
  const decoded = base64Val.toString("utf-8");
  return decoded;
}

const s3 = new AWS.S3({
  region
});

const params = {
  Bucket: BUCKET_NAME
}


app.get("/healthz", (req, res) => {
  try {
      statsClient.increment('systemname.subsystem.value');
      logger.debug("healthz hit");
    return res.status(200).json("server responds with 200 OK if it is healhty.", 200);
  } catch (err) {
    res.json(err.message);
  }
});

app.get("/gettest", async (req, res) => {
  try {
    statsClient.increment('systemname.subsystem.value');
    const allNames = await pool.query("SELECT * FROM healthz");
    res.json(allNames.rows);
  } catch (e) {
    console.error(e.message);
  }
});

// create a new user
app.post("/v1/account", async (req, res) => {
    try {
        statsClient.increment('systemname.subsystem.value');
        logger.debug("new user create hit");
        const reqFields = ["first_name", "last_name", "password", "username"];
        const check = req.body ? Object.keys(req.body) : null;
        const { first_name, last_name, password, username } = req.body;

        const requiredFields1 = ["first_name", "last_name", "password", "username", "account_created", "account_updated"];
        let flag = false;

        check.forEach((value) => {
            if (!requiredFields1.includes(value)) {
                flag = true;
            }
        })

        if (flag) {
            logger.debug("invalid parameters trying to send");
            return res.status(400).json("Only first_name, last_name, username & password are allowed");
        }

        if (!first_name || !last_name || !username || !password) {
            logger.debug("missing fields");
            return res.status(400).json("Fields missing");
        }


        if (!check || !check.length) {
            logger.debug("create with no data ??");
            return res.status(400).json("No data provided!");
        }

        if (!validateEmail(username)) {
            logger.debug("not valid email");
            return res.status(400).json("Enter a valid EmailID!");
        }

        // has the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // check if the username exists
        const existingEmail = await pool.query("SELECT * FROM healthz where username=$1", [username]);
        const newEntry = await pool.query("INSERT INTO healthz (id, first_name, last_name, password, username, account_created, account_updated) values ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, username, account_created, account_updated", [uuid.v4(), first_name, last_name, hashedPassword, username, new Date(), new Date()]);
        res.status(201).json(newEntry.rows[0]);

    } catch (e) {
        if (e.code === '23505') {
            logger.debug("User exits, need to try with different params");
            return res.status(400).json("User already exists");
        }
        console.error(e.message);
    }
});

// get user details once the user is authorized
app.get("/v1/account", async (req, res) => {
    try {
        statsClient.increment('systemname.subsystem.value');
        const decoded = decodeBase64(req); // decode the base64 hashed password via the decodeBase64 method
        const username = decoded.substring(0, decoded.indexOf(':')); // retrieve the username from the string
        const password = decoded.substring(decoded.indexOf(':') + 1, decoded.length); // retrieve the password from the string

        if (!username || !password) {
            logger.debug("no username and password");
            return res.status(403).json('Forbidden Request!');
        }

        const userDetails = await pool.query("SELECT * FROM healthz where username=$1", [username]); // check if the user is present in the DB

        if (userDetails.rows.length == 0) { // if the user does not exist, return Unauthorized
            logger.debug("no user exists");
            return res.status(401).json('Unauthorized');
        }

        bcrypt.compare(password, userDetails.rows[0].password, (err, response) => { // compare the hashed password
            if (err) {
                logger.debug("password mismatch");
                console.error(err.message);
            }

            if (response) { // if the password matches
                const { id, first_name, last_name, username, account_created, account_updated } = userDetails.rows[0];
                const response = {
                    "id": id,
                    "first_name": first_name,
                    "last_name": last_name,
                    "username": username,
                    "account_created": account_created,
                    "account_updated": account_updated
                };
                logger.debug("user fetched successfully");
                res.status(200).json(response); // return the details of the user
            } else { // if the password does not match, return Unauthorized
                logger.debug("username and password does not match");
                return res.status(401).json('Unauthorized');
            }
        })
    } catch (e) {
        if (e.code === '23505') {
            logger.debug("Username in user try another");
            return res.status(400).json("Username in use");
        }
        console.error(e.message);
    }
})

// update user once the user is authenticated
app.put("/v1/account", async (req, res) => {
    try {
        statsClient.increment('systemname.subsystem.value');
        const decoded = decodeBase64(req);
        const new_password = req.body.password;
        const checkUpdate = req.body ? Object.keys(req.body) : null;

        const username = decoded.substring(0, decoded.indexOf(':'));
        const password = decoded.substring(decoded.indexOf(':') + 1, decoded.length);

        if (!username || !password) {
            logger.debug("no username and password");
            return res.status(403).json('Forbidden Request!');
        }


        const check = req.body ? Object.keys(req.body) : null;
        const { first_name, last_name } = req.body;
        const requiredFields = ["first_name", "last_name", "password"];
        let flag = false;

        check.forEach((value) => {
            if (!requiredFields.includes(value)) {
                flag = true;
            }
        })

        if (flag) {
            logger.debug("invalid params");
            return res.status(400).json('Only first_name, last_name, password are allowed!');
        }

        if (!checkUpdate || !checkUpdate.length) {
            logger.debug("empty data ?");
            return res.status(400).json("No data provided!");
        }

        if (checkUpdate.includes("username")) {
            logger.debug("Can't update userName");
            return res.status(400).json("Can't update userName");
        }

        const userDetails = await pool.query("SELECT * FROM healthz where username=$1", [username]);

        if (userDetails.rows.length == 0) {
            return res.status(401).json('Unauthorized');
        }

        bcrypt.compare(password, userDetails.rows[0].password, async (err, response) => {

            if (userDetails.rows[0].username != username) {
                logger.debug("username mismatch");
                return res.status(401).json('Unauthorized');
            }

            if (err) {
                console.error(err.message);
            }
            if (response) {
                const salt1 = await bcrypt.genSalt(10);
                let hashedPassword1;
                if (new_password) { hashedPassword1 = await bcrypt.hash(new_password, salt1); }
                const { first_name, last_name, username, id } = userDetails.rows[0];

                const updatedEntry = await pool.query('UPDATE healthz SET first_name=$1, last_name=$2,password=$3,username=$4,account_updated=$5 WHERE id=$6', [!req.body.first_name ? first_name : req.body.first_name, !req.body.last_name ? last_name : req.body.last_name, !hashedPassword1 ? userDetails.rows[0].password : hashedPassword1, !req.body.username ? username : req.body.username, new Date(), id]);
                logger.debug("user updated successfully");
                res.status(204).json("User updated");
            }

            else {
                logger.debug("invalid username and password");
                return res.status(401).json('Unauthorized');
            }
        })
    } catch (e) {
        if (e.code === '23505') {
            logger.debug("username already exits try another");
            return res.status(400).json("Username in use");
        }
        console.error(e.message);
    }
});


// add a profile picture
app.post("/v1/documents", async (req, res) => {

    try {
        statsClient.increment('systemname.subsystem.value');
        const decoded = decodeBase64(req); // decode the base64 hashed password via the decodeBase64 method
        const username = decoded.substring(0, decoded.indexOf(':')); // retrieve the username from the string
        const password = decoded.substring(decoded.indexOf(':') + 1, decoded.length); // retrieve the password from the string

        if (!username || !password) {
            logger.debug("no username and password");
            return res.status(403).json('Forbidden Request!');
        }

        const userDetails = await pool.query("SELECT * FROM healthz where username=$1", [username]); // check if the user is present in the DB

        if (userDetails.rows.length == 0) { // if the user does not exist, return Unauthorized
            logger.debug("no user exists");
            return res.status(401).json('Unauthorized');
        }

        bcrypt.compare(password, userDetails.rows[0].password, (err, response) => { // compare the hashed password
            if (err) {
                console.error(err.message);
            }

            if (response) { // if the password matches
                const uploadFile = (filename) => {
                    const params = {
                        Bucket: BUCKET_NAME,
                        Key: `${userDetails.rows[0].id}-profile-image`,
                        Body: filename,
                        ContentType: "Image/JPG"
                    }
                    console.log(`${params.Bucket}, ${params.Key}`);
                    s3.upload(params, async (err, data) => {
                        if (err) {
                            console.log(err);
                        } else {
                            const { id, first_name, last_name, username, account_created, account_updated } = userDetails.rows[0];

                            const checker = await pool.query("SELECT * FROM images where user_id=$1", [id]);

                            const randomId = uuid.v4();
                            const myArray = new Date().toISOString().split("T");
                            const dateVal = myArray[0];

                            if (checker.rows.length == 0) {
                                const newEntry = await pool.query("INSERT INTO images (id, user_id, url, upload_date, file_name) values ($1, $2, $3, $4, $5) RETURNING id, user_id, url, upload_date, file_name", [randomId, id, data.Location, new Date(), req.files.file.name]);
                            } else if (checker.rows[0].user_id === id) {
                                const newEntry1 = await pool.query("DELETE FROM images where user_id=$1", [id]);
                                const newEntry = await pool.query("INSERT INTO images (id, user_id, url, upload_date, file_name) values ($1, $2, $3, $4, $5) RETURNING id, user_id, url, upload_date, file_name", [randomId, id, data.Location, new Date(), req.files.file.name]);
                            }
                            const response = {
                                "id": randomId,
                                "user_id": id,
                                "url": data.location,
                                "upload_date": dateVal,
                                "file_name": req.files.file.name
                            };
                            res.status(200).json(response); // return the details of the user
                        }
                    })
                }

                uploadFile(req.files.file.data);

            } else { // if the password does not match, return Unauthorized
                logger.debug("image added successfully");
                return res.status(401).json('Unauthorized');
            }
        })
    } catch (e) {
        if (e.code === '23505') {
            logger.debug("username exists");
            return res.status(400).json("Username in use");
        }
        console.error(e.message);
    }
})

// delete a profile picture
app.delete("/v1/documents", async (req, res) => {
    try {
        statsClient.increment('systemname.subsystem.value');
        const decoded = decodeBase64(req); // decode the base64 hashed password via the decodeBase64 method
        const username = decoded.substring(0, decoded.indexOf(':')); // retrieve the username from the string
        const password = decoded.substring(decoded.indexOf(':') + 1, decoded.length); // retrieve the password from the string

        if (!username || !password) {
            return res.status(403).json('Forbidden Request!');
        }

        const userDetails = await pool.query("SELECT * FROM healthz where username=$1", [username]); // check if the user is present in the DB

        if (userDetails.rows.length == 0) { // if the user does not exist, return Unauthorized
            logger.debug("no data to delete");
            return res.status(401).json('Unauthorized');
        }

        bcrypt.compare(password, userDetails.rows[0].password, (err, response) => { // compare the hashed password
            if (err) {
                console.error(err.message);
            }

            if (response) { // if the password matches
                const deleteFile = (filename) => {
                    const params = {
                        Bucket: BUCKET_NAME,
                        Key: `${userDetails.rows[0].id}-profile-image`
                    }

                    s3.deleteObject(params, async (err, data) => {
                        if (err) {
                            console.log(err);
                        } else {
                            const userDetails1 = await pool.query("DELETE FROM images where user_id=$1", [userDetails.rows[0].id]); // check if the user is present in the DB
                            logger.debug("image deleted");
                            res.status(204).json("Profile image deleted");
                        }
                    })
                }

                deleteFile(req.files.file.data);

            } else { // if the password does not match, return Unauthorized
                logger.debug("username and password do not match");
                return res.status(401).json('Unauthorized');
            }
        })
    } catch (e) {
        if (e.code === '23505') {
            logger.debug("username exists");
            return res.status(400).json("Username in use");
        }
        console.error(e.message);
    }
})

// get a profile picture
app.get("/v1/documents", async (req, res) => {
    try {
        statsClient.increment('systemname.subsystem.value');
        const decoded = decodeBase64(req); // decode the base64 hashed password via the decodeBase64 method
        const username = decoded.substring(0, decoded.indexOf(':')); // retrieve the username from the string
        const password = decoded.substring(decoded.indexOf(':') + 1, decoded.length); // retrieve the password from the string

        if (!username || !password) {
            logger.debug("no username or password");
            return res.status(403).json('Forbidden Request!');
        }

        const userDetails = await pool.query("SELECT * FROM healthz where username=$1", [username]); // check if the user is present in the DB
        const imageDetails = await pool.query("SELECT * FROM images where user_id=$1", [userDetails.rows[0].id]);

        if (imageDetails.rows.length == 0) {
            logger.debug("no image details found");
            return res.status(404).json('Not Found');
        }

        if (userDetails.rows.length == 0) { // if the user does not exist, return Unauthorized
            logger.debug("user does not exists");
            return res.status(401).json('Unauthorized');
        }

        bcrypt.compare(password, userDetails.rows[0].password, (err, response) => { // compare the hashed password
            if (err) {
                console.error(err.message);
            }

            if (response) { // if the password matches
                const { file_name, id, url, upload_date, user_id } = imageDetails.rows[0];
                const myArray = new Date().toISOString().split("T");
                const dateVal = myArray[0];

                const response = {
                    "file_name": file_name,
                    "id": id,
                    "url": url,
                    "upload_date": dateVal,
                    "user_id": user_id
                };
                res.status(200).json(response); // return the details of the user
            } else { // if the password does not match, return Unauthorized
                logger.debug("password does not match");
                return res.status(401).json('Unauthorized');
            }
        })
    } catch (e) {
        if (e.code === '23505') {
            logger.debug("username exists");
            return res.status(400).json("Username in use");
        }
        console.error(e.message);
    }
});

// If page not found, return 404 status
app.get('*', function (req, res) {
    statsClient.increment('systemname.subsystem.value');
    res.status(404).json("Page not found!")
});

app.post('*', function (req, res) {
    statsClient.increment('systemname.subsystem.value');
    res.status(404).json("Page not found!")
});


app.put('*', function (req, res) {
    statsClient.increment('systemname.subsystem.value');
    res.status(404).json("Page not found!")
});


// Function to validate the email
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};


module.exports = app;
