const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// @route    get/api/v1/users
// @desc     Register User.. => (create user),
// @access   Public

router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check(
      "password",
      "please enter a password with six or more character"
    ).isLength({ min: 6 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    res.send("hello from the server");
  }
);

module.exports = router;
