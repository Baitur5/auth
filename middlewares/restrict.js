const restrict = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = "Access denied!";
        res.status(401).send("Access denied!");
    }
};

const restrictAdmin = function(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) {
        next();
    } else {
        req.session.error = "Access denied!";
        res.status(401).send("Access denied!");
    }
};




module.exports = {
    restrict,
    restrictAdmin,
}
