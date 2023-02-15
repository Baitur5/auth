const validateAsync = (schema) => {
  return async (req, res, next) => {
    schema
      .validateAsync(req.body)
      .then(() => {
        next();
      })
      .catch((err) => {
        res.status(400).send(err.details[0].message);
        console.log("Validation error");
      });
    // next();
  };
};

module.exports = { validateAsync };
