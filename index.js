



const { router } = require("./routes/auth");
if (require.main === module) {
    require("dotenv").config();
    var express = require("express");
    var session = require("express-session");
    var mongoose = require("mongoose");

    var app = express();
    const dbURL = process.env.DB_URL;

    app.use(express.json());

    app.use(
        session({
            resave: false,
            saveUninitialized: false,
            secret: process.env.SECRET_KEY,
        })
    );


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
} else {
    const { User } = require("./models/User")
    const { restrict } = require("./middlewares/restrict")
    const { validateAsync } = require("./middlewares/validate")
    module.exports = {
        router,
        User,
        restrict,
        validateAsync
    }
    console.log("Auth Called")
}

