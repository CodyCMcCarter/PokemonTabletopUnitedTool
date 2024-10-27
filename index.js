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
  var finalDamage = 0;

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

  function damageCalculator(db, strikes, hits, stab, crit, doubCrit, atk, def, type){
    var finalDB = 0;
    var critMult = 1;
    var finalDamage = 0;
    finalDB = db * hits;

    if(stab){
      finalDB += 2;
    }
    if(strikes === "double"){
      if(doubCrit){
        critMult = 2;
      } else if(!doubCrit && crit){
        critMult = 1.5;
      }
    } else {
      if (crit){
        critMult = 2;
      }
    }
    finalDB = Math.floor(finalDB * critMult);
    var damageRoll = Math.floor(Math.random() * ((finalDB * 4) - finalDB + 1) + finalDB);
    finalDamage = damageRoll + atk - def;
    finalDamage = Math.floor(finalDamage * type);
    return finalDamage;
  }

  app.get("/", (req, res) => {
    res.render("login.ejs");
  });

  app.get("/home", (req, res) => {
    if(user !== ""){
      res.render("home.ejs", {user: user});
    }else{
      res.redirect("/");
    }
  })

  app.get("/resources", (req, res) => {
    if(user !== ""){
      res.render("resources.ejs");
    }else{
      res.redirect("/");
    }
  })

  app.get("/attackCalc", (req, res) => {
    if(user !== ""){
      res.render("attackCalc.ejs", {finalDamage: finalDamage});
    }else{
      res.redirect("/");
    }
  })

  app.get("/characterSheets", async (req, res) => {
    if(user !== ""){
      var characters = await getCharacters();
      res.render("characterSheets.ejs", {user: user, characters: characters});
    }else{
      res.redirect("/");
    }
  })

  app.get("/pokemonSheets", async (req, res) => {
    if(user !== ""){
      var pokemon = await getPokemon();
      res.render("pokemonSheets.ejs", {user: user, pokemon: pokemon});
    }else{
      res.redirect("/");
    }
  })

  app.get("/typeChart", (req, res) => {
    if(user !== ""){
      res.render("typeChart.ejs");
    }else{
      res.redirect("/");
    }
  })

  app.get("/logout", (req, res) => {
    user = "";
    res.redirect("/");
  })

  app.post("/calculateDamage", (req, res) => {
    finalDamage = 0;
    var damageBase = parseInt(req.body.damageBase);
    var strikeNumber = req.body.strikeNumber;
    var hits = Number(req.body.hitCount);
    var stab = req.body.stab;
    var crit = req.body.crit;
    var doubCrit = req.body.doubleCrit;
    var attack = Number(req.body.damageStat) + Number(req.body.damageMods);
    var defense = Number(req.body.defenseStat) + Number(req.body.defenseMods);
    var typeMultiplier = parseFloat(req.body.typeMultiplier);

    finalDamage = damageCalculator(damageBase, strikeNumber, hits, stab, crit, doubCrit, attack, defense, typeMultiplier);
    res.redirect("/attackCalc");
  });

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