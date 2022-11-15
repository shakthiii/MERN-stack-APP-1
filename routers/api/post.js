const express = require("express");

const router = express.Router();

// @route    get/api/v1/users/post
// @desc     Test route
// @access   Public

router.get("/post", (req, res) => {
  res.send("post route");
});

module.exports = router;
