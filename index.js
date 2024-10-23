import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  db.connect();

  var user = "";

  async function isAuthenticated(username) {
    try{
        var result = await db.query("SELECT name FROM users WHERE name = $1", [username]);
        if (result.rows.length > 0) {
            user = username;
        } else {
            user = "";
        }
    }catch(e){
        console.log(e)
    }
  }

  app.get("/", (req, res) => {
    res.render("login.ejs");
  });

  app.get("/home", (req, res) => {
    res.render("home.ejs", {user: user});
  })

  app.get("/typeChart", (req, res) => {
    res.render("typeChart.ejs")
  })

  app.get("/logout", (req, res) => {
    user = "";
    res.redirect("/")
  })

  app.post("/login", async (req, res) => {
    var username = req.body.username;
    username = username.toLowerCase();
    await isAuthenticated(username);
    if(user !== "") {
        res.redirect("/home");
    } else {
        res.redirect("/")
    }
  })

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });