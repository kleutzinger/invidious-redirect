const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const axios = require("axios");

const PORT = process.env.PORT || 5000;
const api = require("./api.js");
const rank = require("./rank.js");
const app = express();
const url = require("url");
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

async function get_redirected_url(path) {
  // path = /watch?v=123
  const { best_uri } = await api.get();
  const full_url = urljoin(best_uri, path);
  console.log("redirecting to: " + full_url);
  return full_url;
}

app.get("/get-link", async (req, res, next) => {
  try {
    console.log(req.query);
    const { url: given_url } = req.query;
    const path = url.parse(given_url).path;
    res.redirect(await get_redirected_url(path));
  } catch (error) {
    next(error);
  }
});

app.get("/robots.txt", (req, res) => {
  // 404 for robots.txt
  res.status(404).send("not found");
});

app.get("/*", async (req, res, next) => {
  try {
    // catch-all to redirect to best instance
    res.redirect(await get_redirected_url(req.url));
  } catch (error) {
    next(error);
  }
});
