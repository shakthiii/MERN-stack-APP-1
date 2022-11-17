const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const User = require("../../models/UserModel");
const jwt = require("jsonwebtoken");

// @route    POST / api/v1/users
// @desc     Register User.. => (create user),
// @access   public

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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    try {
      //see if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ message: "User already exist" }] });
      }
      //generate gravatar

      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Encrypt password

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      //Return jsonwebtoken to use in frontend

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.SECRET_KEY,
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
      // res.json({ JWToken });

      // if (JWToken) {
      //   res.status(400).json({ error: "token error" });
      // } else {
      //   res.json({ JWToken });
      // }
      // res.send("user registered successfully");
    } catch (err) {
      console.log(err.message);
      res.status(500).json({
        status: "Server error",
        message: err,
      });
    }
  }
);

// @route    get/api/v1/users
// @desc     Authenticate User.. => (Login user),
// @access   Public

router.post(
  "/auth",
  [
    check("email", "Email is required").isEmail(),
    check("password", "password is required!").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    console.log(email, password);

    try {
      //see if user exists
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ message: "Invalid credentials" }] });
      }

      console.log(user);

      //Decrypt password

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ message: "Invalid credentials" }] });
      }
      //Return jsonwebtoken to use in frontend

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.SECRET_KEY,
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          return res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).json({
        status: "Server error",
        message: err,
      });
    }
  }
);

module.exports = router;
