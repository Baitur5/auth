const mongoose = require("mongoose");

const userForm = new mongoose.Schema({
  fname: { type: String, min: 3, max: 255, required: true },
  lname: { type: String, min: 3, max: 255, required: true },
  email: { type: String, min: 6, max: 255, required: true },
  password: { type: String, min: 6, max: 255, required: true },
  salt: { type: String },
  hash: { type: String },
});

module.exports = mongoose.model("User", userForm);
