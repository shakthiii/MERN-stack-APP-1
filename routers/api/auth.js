const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const User = require("../../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

// @route    get/api/v1/users/auth
// @desc     Authenticate route
// @access   Protected

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.send({ user });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      status: "error",
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
