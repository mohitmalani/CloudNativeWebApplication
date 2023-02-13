const express = require("express");
const app = express();
const pool = require("./database");
const bcrypt = require("bcryptjs");
const { copyDone } = require("pg-protocol/dist/messages");

app.use(express.json());

function decodeBase64(req) {
  const hashedHeader = req.headers.authorization;
  const encoded = hashedHeader.substring(6, hashedHeader.length);
  const base64Val = Buffer.from(encoded, "base64");
  const decoded = base64Val.toString("utf-8");
  return decoded;
}

app.get("/healthz", (req, res) => {
  try {
    res.status(200).json("server responds with 200 OK if it is healhty.", 200);
  } catch (err) {
    res.json(err.message);
  }
});

app.get("/gettest", async (req, res) => {
  try {
    const allNames = await pool.query("SELECT * FROM healthz");
    res.json(allNames.rows);
  } catch (e) {
    console.error(e.message);
  }
});

app.post("/v1/account", async (req, res) => {
  try {
    const required_fields = ["first_name", "last_name", "password", "username"];
    const check = req.body ? Object.keys(req.body) : null;
    const { first_name, last_name, password, username } = req.body;

    if (!check || !check.length) {
      res.status(400).json("fields mandatory");
    }

    if (JSON.stringify(check) !== JSON.stringify(required_fields)) {
      res
        .status(400)
        .json("first_name, last_name, username, password are mandatory!");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const allNames = await pool.query(
      "INSERT INTO healthz(first_name, last_name, username, password, account_created, account_updated) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, username, account_created, account_updated",
      [first_name, last_name, username, hashedPassword, new Date(), new Date()]
    );
    res.status(201).json(allNames.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      res.status(400).json("Bad request");
    }
  }
});

app.get("/v1/account", async (req, res) => {
  try {
    const decoded = decodeBase64(req);
    const username = decoded.substring(0, decoded.indexOf(":"));
    const password = decoded.substring(
      decoded.indexOf(":") + 1,
      decoded.length
    );
    const allNames = await pool.query(
      "SELECT * FROM healthz WHERE username =$1",
      [username]
    );
    if (allNames.rows.length > 0) {
      bcrypt.compare(password, allNames.rows[0].password, (err, response) => {
        if (err) {
          console.error(err.message);
        }
        if (response) {
          const newval = allNames.rows[0];
          delete newval["password"];
          res.status(200).json(allNames.rows[0]);
        } else {
          res.status(401).json("Unauthorized");
        }
      });
    } else {
      res.status(401).json("Unauthorized");
    }
  } catch (e) {
    if (e.code === "23505") {
      res.status(400).json("Bad request");
    }
  }
});

app.put("/v1/account", async (req, res) => {
  try {
    const decoded = decodeBase64(req);
    const username = decoded.substring(0, decoded.indexOf(":"));
    const password = decoded.substring(
      decoded.indexOf(":") + 1,
      decoded.length
    );
    if (!username || !password) {
      return res.status(403).json("Forbidden Request");
    }
    const allNames = await pool.query(
      "SELECT * FROM healthz WHERE username =$1",
      [username]
    );
    if (allNames.rows.length > 0) {
      bcrypt.compare(
        password,
        allNames.rows[0].password,
        async (err, response) => {
          if (err) {
            console.error(err.message);
          }
          if (response) {
            try {
                const { first_name, last_name, password} = req.body;
                const required_fields = ["first_name", "last_name", "password"];
                const check = req.body ? Object.keys(req.body) : null;
  
                if (!check || !check.length) {
                  return res.status(400).json("fields mandatory");
                }
            
                if (JSON.stringify(check) !== JSON.stringify(required_fields)) {
                  return res
                    .status(400)
                    .json("first_name, last_name, password are mandatory!");
                }

              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash(password, salt);

              const update = await pool.query(
                "UPDATE healthz SET first_name=$1, last_name=$2,password=$3,account_updated=$4 WHERE id=$5",
                [
                  !req.body.first_name ? first_name : req.body.first_name,
                  !req.body.last_name ? last_name : req.body.last_name,
                  hashedPassword,
                  new Date(),
                  allNames.rows[0].id,
                ]
              );
              res.status(201).json("User updated");
            } catch (e) {
              if (e.code === "23505") {
                return res.status(400).json("Bad request");
              }
            }
          } else {
            return res.status(401).json("Unauthorized");
          }
        }
      );
    } else {
      return res.status(401).json("Unauthorized");
    }
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json("Bad request");
    }
  }
});

app.get("*", function (req, res) {
  res.send("Page not found!", 404);
  res.status(200).json("page not found:404", 200);
});

module.exports = app;
