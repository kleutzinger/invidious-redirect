const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const axios = require("axios");

const PORT = process.env.PORT || 5000;
const INTERNAL_URL = `http://localhost:${PORT}`;

const app = express();
// const _ = require("lodash");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const path = require("path");
var fs = require("fs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.set('view engine', 'pug');
var cors = require("cors");
app.use(cors());
app.use(require("serve-favicon")(path.join(__dirname, "favicon.ico")));
app.use(morgan("tiny"));

const server = app.listen(PORT, () => {
  console.log("server at http://localhost:" + PORT);
});

app.get("/", (req, res) => {
  console.log(req.query);
  res.end(
    `
    <h1>Hi, I redirect things to invidious instances, give my url a /watch?v=...</h1>
    </br>
    <h2>example: 
      <a href="/watch?v=1WCsfcQgjk8"> invidious.kevbot.xyz/watch?v=1WCsfcQgjk8 </a>
    </h2>
    `
  );
  // res.redirect("https://google.com");
});

app.get("/watch", (req, res) => {
  const { v } = req.query;
  if (v) {
    res.redirect(`https://invidious.fdn.fr/watch?v=${v}`);
  } else {
    res.status(400).json({ message: "Please supply watch?v=" });
  }
});
