const express = require("express");

const router = express.Router();

// @route    get/api/v1/users/auth
// @desc     Test route
// @access   Public

router.get("/auth", (req, res) => {
  res.send("auth route");
});

module.exports = router;
