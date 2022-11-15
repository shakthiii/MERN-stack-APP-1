const express = require("express");

const router = express.Router();

// @route    get/api/v1/users
// @desc     Test route
// @access   Public

router.get("/", (req, res) => {
  res.send("user route ");
});

module.exports = router;
