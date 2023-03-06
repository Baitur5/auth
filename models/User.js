const mongoose = require("mongoose");

const userForm = new mongoose.Schema({
    fname: { type: String, min: 3, max: 255, required: true },
    lname: { type: String, min: 3, max: 255, required: true },
    email: { type: String, min: 6, max: 255, required: true },
    password: { type: String, min: 6, max: 255, required: true },
    salt: { type: String, required: true },
    hash: { type: String, required: true },
    isActive: { type: Boolean, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    secretKey: { type: String, min: 4, max: 10 },
});
const User = mongoose.model("User", userForm);

module.exports = { User } 
