require("dotenv").config();
const router = require("express").Router();
var pbpassword = require("pbkdf2-password");
var hasher = pbpassword();

const User = require("../models/User");

const {
    registerSchema,
    loginSchema,
    forgotSchema,
    resetSchema,
    updateSchema,
    activateSchema,
} = require("../models/validation");

const { restrict } = require("../middlewares/restrict");
const { validateAsync } = require("../middlewares/validate");
const { getHashedPassword } = require("../services/getHashedPass");

const transporter = require("../services/mail");

async function authenticate(res, email, pass, fn) {
    var user = await User.findOne({ email: email, password: pass });
    if (!user) return fn(null, null);

    if (user.isActive === false) {
        res.status(400).send("Please confirm your account before signing in!");
        return;
    }
    hasher({ password: pass, salt: user.salt }, function(err, pass, salt, hash) {
        if (err) return fn(err);
        if (hash === user.hash) return fn(null, user);
        fn(null, null);
    });
}

router.post(
    "/register",
    validateAsync(registerSchema),
    async (req, res, next) => {
        try {
            const { salt, hash } = await getHashedPassword(req.body.password);
            const emailExist = await User.findOne({ email: req.body.email });

            if (emailExist) {
                if (!emailExist.isActive) {
                    res.status(400).send("Email already exist,but not activated!");
                    return;
                }
                res.status(400).send("Email already exist!");
                return;
            }

            let randomString = Math.random().toString(36).substring(2, 8);

            var mailOptions = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: "Code to activate your account",
                text: randomString,
            };

            const user = new User({
                fname: req.body.fname,
                lname: req.body.lname,
                email: req.body.email,
                password: req.body.password,
                salt: salt,
                hash: hash,
                isActive: false,
                secretKey: randomString,
            });

            transporter.sendMail(mailOptions, async function(error, info) {
                if (error) {
                    throw new Error("Mail error");
                } else {
                    await user.save();

                    res.status(200).send("Check your email for activation code!");
                }
            });
        } catch (error) {
            res.status(500).send(error);
        }
    }
);

router.post(
    "/activate",
    validateAsync(activateSchema),
    async function(req, res) {
        try {
            var user = await User.findOne({
                email: req.body.email,
            });

            if (user && user.isActive) {
                res.status(400).send("Your account is already activated!");
                return;
            }

            if (!user || user.secretKey !== req.body.secretKey) {
                res.status(400).send("Invalid email or secret code!");
                return;
            }

            await User.updateOne(
                { email: user.email, secretKey: req.body.secretKey },
                { $set: { isActive: true, secretKey: "" } }
            );

            res.status(201).send("Your account activated");
        } catch (error) {
            res.status(500).send(error);
        }
    }
);

router.post(
    "/send_activation",
    validateAsync(forgotSchema),
    async (req, res) => {
        try {
            const emailExist = await User.findOne({ email: req.body.email });

            if (!emailExist) {
                res.status(400).send("Email doesn't exist!");
                return;
            }

            if (emailExist.isActive) {
                res.status(400).send("Email already activated");
                return;
            }
            let randomString = Math.random().toString(36).substring(2, 8);

            var mailOptions = {
                from: process.env.EMAIL,
                to: req.body.email,
                subject: "Code to activate your account",
                text: randomString,
            };

            transporter.sendMail(mailOptions, async function(error, info) {
                if (error) {
                    throw new Error("Mail error");
                } else {
                    await User.updateOne(
                        { email: emailExist.email },
                        { $set: { secretKey: randomString } }
                    );
                    console.log("Email has been sent");
                }
            });

            res
                .status(200)
                .send("Activation code has been sent to your email,please check it!");
        } catch (error) {
            res.status(500).send(error);
        }
    }
);

router.post(
    "/login",
    validateAsync(loginSchema),
    async function(req, res, next) {
        try {
            authenticate(
                res,
                req.body.email,
                req.body.password,
                function(err, user) {
                    if (err) return next(err);
                    if (user) {
                        req.session.regenerate(function() {
                            req.session.user = user;
                            res.status(200).send("Successful login");
                        });
                    } else {
                        res.status(400).send("Email or password is wrong");
                    }
                }
            );
        } catch (error) {
            res.status(500).send(error);
        }
    }
);

router.put(
    "/update",
    restrict,
    validateAsync(updateSchema),
    async (req, res) => {
        try {
            const { salt, hash } = await getHashedPassword(req.body.new_password);

            if (req.session.user.password !== req.body.old_password) {
                res.status(400).send("Your old password is wrong!");
                throw new Error("Old password is wrong");
            }
            if (req.session.user.password === req.body.new_password) {
                res.status(400).send("Enter different password!");
                throw new Error("Enter different password");
            }

            let user = await User.findOneAndUpdate(
                { email: req.session.user.email },
                { $set: { password: req.body.new_password, salt: salt, hash: hash } },
                { returnDocument: "after" }
            );

            req.session.user = user;

            res.status(200).send("Your password is successfully updated");
        } catch (error) {
            res.status(500).send(error);
        }
    }
);

router.post("/forgot", validateAsync(forgotSchema), async (req, res, next) => {
    try {
        var user = await User.findOne({ email: req.body.email });
        if (!user || !user.isActive) {
            res.status(400).send("There is no such registered or activated email!");
            return;
        }

        let randomString = Math.random().toString(36).substring(2, 8);

        var mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Code to reset your email",
            text: randomString,
        };

        transporter.sendMail(mailOptions, async function(error, info) {
            if (error) {
                throw new Error("Mail error");
            } else {
                await User.updateOne(
                    { email: user.email },
                    { $set: { secretKey: randomString } }
                );
                console.log("Email has been sent");
            }
        });

        res.status(200).send("Code has been sent to your email,please check it!");
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post("/reset", validateAsync(resetSchema), async (req, res) => {
    try {
        var user = await User.findOne({
            email: req.body.email,
            secretKey: req.body.secretKey,
        });

        if (!user) {
            res.status(400).send("Invalid email or secret code!");
            return;
        }

        if (req.body.password === user.password) {
            res
                .status(400)
                .send("Your new and old password are same,provide different password!");
            return;
        }

        const { salt, hash } = await getHashedPassword(req.body.password);
        await User.updateOne(
            { email: user.email },
            {
                $set: {
                    password: req.body.password,
                    salt: salt,
                    hash: hash,
                    secretKey: "",
                },
            }
        );
        res.status(200).send("Your password updated!");
    } catch (error) {
        res.status(500).send(error);
    }
});

//restricted route
router.get("/all", restrict, (req, res) => {
    try {
        User.find({}, { salt: 0, hash: 0, _id: 0, __v: 0 }, (err, result) => {
            res.status(200).send(result);
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post("/logout", function(req, res) {
    if (!req.session.user) {
        res.status(400).send("You are not logged in!");
    } else {
        req.session.destroy(function() {
            res.status(200).send("Successful Logout!");
        });
    }
});

module.exports = { router };
