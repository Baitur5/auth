const mongoose = require("mongoose");

const forgotUserForm = new mongoose.Schema({
  email: { type: String, min: 6, max: 255, required: true },
  secretKey: { type: String, min: 4, max: 10, required: true },
});

module.exports = mongoose.model("forgotUser",forgotUserForm);
