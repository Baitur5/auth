module.exports.restrict = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = "Access denied!";
    res.status(400).send("Access denied!");
  }
};
