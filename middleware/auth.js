const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // get the token from header.
  const token = req.header("auth-token");

  //check no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  //verify token

  try {
    const decode = jwt.verify(token, process.env.SECRET_KEY);

    //getting user information using token id
    req.user = decode.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
