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
        console.log(e);
    }
  }

  async function getCharacters() {
    try{
      if(user === process.env.ADMIN_USER){
        var result = await db.query("SELECT * FROM characterSheets");
        return result.rows;
      }else{
        var result = await db.query("SELECT * FROM characterSheets WHERE player = $1", [user]);
        return result.rows;
      }
    }catch(e){
      console.log(e);
    }
  }

  async function getPokemon() {
    try{
      if(user === process.env.ADMIN_USER){
        var result = await db.query("SELECT * FROM pokemonSheets");
        return result.rows;
      }else{
        var result = await db.query("SELECT * FROM pokemonSheets WHERE player = $1", [user]);
        return result.rows;
      }
    }catch(e){
      console.log(e);
    }
  }

  app.get("/", (req, res) => {
    res.render("login.ejs");
  });

  app.get("/home", (req, res) => {
    res.render("home.ejs", {user: user});
  })

  app.get("/resources", (req, res) => {
    res.render("resources.ejs");
  })

  app.get("/attackCalc", (req, res) => {
    res.render("attackCalc.ejs", {user: user});
  })

  app.get("/characterSheets", async (req, res) => {
    var characters = await getCharacters();
    res.render("characterSheets.ejs", {user: user, characters: characters});
  })

  app.get("/pokemonSheets", async (req, res) => {
    var pokemon = await getPokemon();
    res.render("pokemonSheets.ejs", {user: user, pokemon: pokemon});
  })

  app.get("/typeChart", (req, res) => {
    res.render("typeChart.ejs");
  })

  app.get("/logout", (req, res) => {
    user = "";
    res.redirect("/");
  })

  app.post("/login", async (req, res) => {
    var username = req.body.username;
    username = username.toLowerCase();
    await isAuthenticated(username);
    if(user !== "") {
        res.redirect("/home");
    } else {
        res.redirect("/");
    }
  })

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });