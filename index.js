const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const axios = require("axios");

const PORT = process.env.PORT || 5000;
const api = require("./api.js");
const rank = require("./rank.js");
const app = express();
const _ = require("lodash");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const urljoin = require("url-join");
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
  res.sendFile("index.html", { root: __dirname });
});

app.get("/watch", async (req, res, next) => {
  try {
    // const best_uri = "https://youtube.com/";
    const { v } = req.query;
    if (v) {
      const { best_uri, all_instances } = await api.get();
      // best uri has a slash already
      const full_url = urljoin(`${best_uri}`, `watch?v=${v}`);
      res.redirect(full_url);
      // res.redirect(`https://invidious.fdn.fr/watch?v=${v}`);
    } else {
      res.status(400).json({ message: "Please supply watch?v=" });
    }
  } catch (error) {
    next(error);
  }
});

app.get("/api", async (req, res, next) => {
  try {
    res.json(await api.get());
  } catch (error) {
    next(error);
  }
});

app.get("/cache", async (req, res, next) => {
  try {
    res.json(api.cache.stats);
  } catch (error) {
    next(error);
  }
});

app.get("/rank", async (req, res, next) => {
  try {
    const summaries = await rank.get_ranks();
    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});
