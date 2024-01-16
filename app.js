const express = require("express");
const mustacheExpress = require("mustache-express");
const Pool = require("pg").Pool;
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });
const bcrypt = require("bcrypt");
const sessions = require("express-session");

const app = express();
const port = process.env.PORT || 3010;

const pool = new Pool({
  user: "winter_wave_3983",
  host: "168.119.168.41",
  database: "winter_wave_3983",
  password: "1a4749bd7f6729b3ea7e59c1ead54930",
  port: 18324,
});

const bbz307 = require("bbz307");
const login = new bbz307.Login("users", ["email", "password"], pool);

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: 86400000, secure: false },
    resave: false,
  })
);
// sortiert nach den drei arten des fressens
app.get("/", async function (req, res) {
  var diets = await pool.query("select distinct diet from dino_posts;");
  res.render("start", { diets: diets.rows });
});
// sortiert die dinos nach fressen
app.get("/diet/:name", async function (req, res) {
  const dinos = await pool.query(
    "SELECT * FROM dino_posts WHERE diet = $1 order by Name ASC",
    [req.params.name]
  );
  res.render("diet", { diet: req.params.name, dinos: dinos.rows });
});
// dino seite
app.get("/dino/:name", async function (req, res) {
  const dinos = await pool.query(
    "SELECT * FROM dino_posts WHERE dino_id = $1",
    [req.params.name]
  );
  res.render("dino", { dino: dinos.rows[0] });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// Register
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", upload.none(), async (req, res) => {
  const user = await login.registerUser(req);
  if (user) {
    res.redirect("/login");
    return;
  } else {
    res.redirect("/register");
    return;
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", upload.none(), async (req, res) => {
  const user = await login.loginUser(req);
  if (!user) {
    res.redirect("/login");
    return;
  } else {
    res.redirect("/");
    return;
  }
});

app.get("/intern", async (req, res) => {
  const user = await login.loggedInUser(req); // <--
  if (!user) {
    // <--
    res.redirect("/login"); // <--
    return; // <--
  } // <--
  res.render("intern", { user: user });
});

// Seite für neue Posts
app.get("/new_post", function (req, res) {
  res.render("new_post");
});

app.post("/new_post", upload.single("picture"), async function (req, res) {
  const user = await login.loggedInUser(req);
  if (!user) {
    res.redirect("/login");
    return;
  }
  await pool.query(
    "INSERT INTO dino_posts (name, diet, lifespan, habitat, period, user_id, picture) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      req.body.name,
      req.body.diet,
      req.body.lifespan,
      req.body.habitat,
      req.body.period,
      user.id,
      req.file.filename,
    ]
  );
  res.redirect("/");
});

// posts liken
app.post("/like/:id", upload.none(), async function (req, res) {
  const user = await login.loggedInUser(req);
  if (!user) {
    res.redirect("/login");
    return;
  }
  await pool.query("INSERT INTO likes (diono_id, user_id) VALUES ($1, $2)", [
    req.params.id,
    user.id,
  ]);
  res.redirect("/");
});
