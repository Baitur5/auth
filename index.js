"use strict";
var express = require("express");
var session = require("express-session");
var mongoose = require("mongoose");

var app = express();
const dbURL = "mongodb://localhost:27017/auth_jwt";

app.use(express.json());

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "secret key",
  })
);

const router = require("./routes/auth");

app.use("/api/", router);
mongoose.connect(
  dbURL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Database started");
  }
);
app.listen(3000, () => {
  console.log("Server started");
});
