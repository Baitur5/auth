var pbpassword = require("pbkdf2-password");
var hasher = pbpassword();

async function getHashedPassword(password) {
  const { salt, hash } = await new Promise((resolve, reject) => {
    hasher({ password: password }, function (err, pass, salt, hash) {
      if (err) throw err;
      resolve({ salt, hash });
    });
  });
  return { salt, hash };
}

module.exports = { getHashedPassword };
