require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const mySecret = process.env.MONGO_URI;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Start of Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

// Start of Model
const Url = mongoose.model("Url", urlSchema);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const original_url = req.body.url;
  const regex = /^(http|https):\/\//;

  if (!regex.test(original_url)) {
    res.json({ error: "invalid url" });
    return;
  }

  const storedUrl = await Url.findOne(
    { original_url: original_url },
    (err, data) => {
      if (err) return console.log(err);
      if (data) {
        return data;
      }
    }
  );

  if (storedUrl) {
    return res.json({
      original_url: storedUrl.original_url,
      short_url: storedUrl.short_url,
    });
  }

  const urls = await Url.find({});

  let newUrl = new Url({
    original_url: original_url,
    short_url: urls.length + 1,
  });

  newUrl.save((err, data) => {
    if (err) return console.log(err);
    return res.json({
      original_url: data.original_url,
      short_url: data.short_url,
    });
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const short_url = req.params.short_url;
  const storedUrl = await Url.findOne({ short_url: short_url }, (err, data) => {
    if (err) return console.log(err);
    if (data) {
      return;
    }
  });
  res.redirect(storedUrl.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
