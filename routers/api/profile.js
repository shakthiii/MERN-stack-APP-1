const express = require("express");

const router = express.Router();

// @route    get/api/v1/users/profile
// @desc     Test route
// @access   Public

router.get("/profile", (req, res) => {
  res.send("profile route");
});

module.exports = router;
