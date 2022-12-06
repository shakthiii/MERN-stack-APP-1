const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const User = require("../../models/UserModel");
const jwt = require("jsonwebtoken");
const auth = require("../../middleware/auth");
const UserSchema = require("../../schema/UserSchema");

const Profile = require("../../models/ProfileModel");

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

// @route    PUT / api/v1/users/update/:user_id
// @desc     Update User,
// @access   private

router.put("/update/:user_id", auth, async (req, res) => {
  try {
    let user = await User.find({ _id: req.user.id });

    // console.log(req.user);

    //update user,

    const { name, email, avatar, password, role } = req.body;

    const updateData = {
      name,
      email,
      avatar,
      password,
      role,
    };

    console.log(user);

    console.log(req.user.id);
    console.log(req.params.user_id);

    if (user && req.user.id === req.params.user_id) {
      user = await User.findOneAndUpdate(
        { _id: req.params.user_id },
        { $set: updateData },
        { new: true }
      );
    } else {
      console.log("user id and params id not match");
    }

    console.log(user);

    await user.save();

    res.send({ user });
  } catch (error) {
    console.error(error.message);
    console.log(error);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

// @route    DELETE / api/v1/users/delete
// @desc     delete my account,
// @access   private

router.delete("/delete", auth, async (req, res) => {
  try {
    if (req.user.id === req.params.user_id) {
      await User.findOneAndRemove({ _id: req.user.id });
      await Profile.findOneAndRemove({ user: req.user.id });
    } else {
      console.log("req id and params id not match");
    }

    res.status(201).json({ message: "user deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

module.exports = router;
