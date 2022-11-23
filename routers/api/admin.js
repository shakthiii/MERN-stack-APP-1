const express = require("express");
const { check, validationResult } = require("express-validator");

const router = express.Router();
const auth = require("../../middleware/auth");
const { authUser } = require("../../middleware/middleware");
const Profile = require("../../models/ProfileModel");
const User = require("../../models/UserModel");

const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserSchema = require("../../schema/UserSchema");

// @route    GET / api/v1/admin
// @desc     admin dashboard,
// @access   Private

router.get("/", auth, authUser, async (req, res) => {
  res.send("Admin page");
});

// @route    POST / api/v1/admin/users/add
// @desc     Register User.. => (create user),
// @access   public

router.post(
  "/users/add",
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

// @route    PATCH / api/v1/admin/update/:user_id
// @desc     Update User,
// @access   private

router.put("/update/:user_id", auth, async (req, res) => {
  try {
    let user = await User.find({ _id: req.user.id });

    //update user,

    const { name, email, avatar, password, role } = req.body;

    const updateData = {
      name,
      email,
      avatar,
      password,
      role,
    };

    if (user) {
      user = await User.findOneAndUpdate(
        { _id: req.params.user_id },
        { $set: updateData },
        { new: true }
      );
    }

    await user.save();

    res.send({ user });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});
// @route    GET / api/v1/admin/users
// @desc     Get all users,
// @access   private
router.get("/users", auth, async (req, res) => {
  try {
    const user = await User.find().select(" -avatar -__v -password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

// @route    GET / api/v1/admin/users
// @desc     Get all users,
// @access   private

router.delete("/delete/:user_id", auth, async (req, res) => {
  try {
    await User.findOneAndRemove({ _id: req.params.user_id });

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
