const router = require("express").Router();
var pbpassword = require("pbkdf2-password");
var hasher = pbpassword();

const User = require("../models/User");
const forgotUser = require("../models/forgotUser");

const {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} = require("../models/validation");

const { restrict } = require("../middlewares/restrict");
const { validateAsync } = require("../middlewares/validate");
const { getHashedPassword } = require("../services/getHashedPass");

const transporter = require("../services/mail");

async function authenticate(email, pass, fn) {
  var user = await User.findOne({ email: email, password: pass });
  if (!user) return fn(null, null);
  hasher({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user);
    fn(null, null);
  });
}

router.post("/register", validateAsync(registerSchema), async (req, res) => {
  try {
    const { salt, hash } = await getHashedPassword(req.body.password);
    const user = new User({
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      password: req.body.password,
      salt: salt,
      hash: hash,
    });
    console.log(user);
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) {
      res.status(400).send("Email already exist!");
      return;
    }
    await user.save();
    res.status(201).send("user created");
  } catch (error) {
    // res.status(500).send(error);
    console.log(error);
  }
});

router.post(
  "/login",
  validateAsync(loginSchema),
  async function (req, res, next) {
    try {
      authenticate(req.body.email, req.body.password, function (err, user) {
        if (err) return next(err);
        if (user) {
          req.session.regenerate(function () {
            req.session.user = user;
            res.status(200).send("Successful login");
          });
        } else {
          res.status(400).send("Email or password is wrong");
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
);

router.post("/forgot", validateAsync(forgotSchema), async (req, res) => {
  try {
    var user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).send("There is no such email registered!");
      throw new Error();
    }

    let randomString = Math.random().toString(36).substring(2, 8);
    const userForm = new forgotUser({
      email: user.email,
      secretKey: randomString,
    });
    var mailOptions = {
      from: "ulukbekovbr@gmail.com",
      to: user.email,
      subject: "Code to reset your email",
      text: randomString,
    };

    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        res.sendStatus(500);
        console.log(error);
        throw new Error();
      } else {
        await userForm.save();
        console.log("Email has been sent");
      }
    });

    res.status(200).send("Code has been sent to your email,please check it!");
  } catch (error) {
    console.log(error);
  }
});

router.post("/reset", validateAsync(resetSchema), async (req, res) => {
  try {
    var user = await forgotUser.findOne({
      email: req.body.email,
      secretKey: req.body.secretKey,
    });

    if (!user) {
      res.status(400).send("Invalid email or secret code!");
      throw new Error();
    }

    if (req.body.password !== req.body.confirm_password) {
      res.status(400).send("You have to provide two identical passwords!");
      throw new Error();
    }
    const oldUser = await User.findOne({ email: user.email });
    if (req.body.password === oldUser.password) {
      res
        .status(400)
        .send("Your new and old password are same,provide different password!");
      throw new Error();
    }

    const { salt, hash } = await getHashedPassword(req.body.password);
    await User.updateOne(
      { email: user.email },
      { $set: { password: req.body.password, salt: salt, hash: hash } }
    );
    await forgotUser.deleteOne({
      email: user.email,
      secretKey: user.secretKey,
    });
    res.status(200).send("Your password updated!");
  } catch (error) {
    console.log(error);
  }
});

//restricted route
router.get("/all", restrict, (req, res) => {
  try {
    User.find({}, { salt: 0, hash: 0, _id: 0, __v: 0 }, (err, result) => {
      res.send(result);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/logout", function (req, res) {
  if (!req.session.user) {
    res.status(400).send("You are not logged in!");
  } else {
    req.session.destroy(function () {
      res.send("Successful Logout!");
    });
  }
});
module.exports = router;
