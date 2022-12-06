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
    res.json({
      total: user.length,
      user,
    });
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

//profile page admin access

// @route    GET /api/v1/admin/users/profile
// @desc     get all profiles
// @access   public

router.get("/users/profiles", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json({
      total: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

// @route    get/api/v1/users/profile/:user_id
// @desc     get single User profile
// @access   Private

router.get("/users/profile/:user_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      _id: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ message: "User Profile not found!" }] });
    }
    res.status(200).json({ profile });
  } catch (error) {
    console.log(err.message);
    res.status(500).json({
      status: "Server error",
      message: err,
    });
  }
});

// @route    PUT /api/v1/admin/:user_id/experience/new
// @desc     add profile experience
// @access   private

router.put(
  "/:user_id/experience/new",
  auth,
  [
    check("title", "title is required").not().isEmpty(),
    check("company", "company is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log(req.params);

    const { company, title, from, location, to, current, description } =
      req.body;

    const newExp = {
      company,
      title,
      from,
      location,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ _id: req.params.user_id });
      console.log(profile);
      profile.experience.unshift(newExp);
      await profile.save();

      res.json({ profile });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        status: "Server error",
        message: error,
      });
    }
  }
);

// @route    PUT /api/v1/admin/:user_id/experience/update/:exp_id
// @desc     update experience details
// @access   private

router.put(
  "/:user_id/experience/update/:ex_id",
  auth,
  [
    check("title", "title is required").not().isEmpty(),
    check("company", "company is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company, title, from, location, to, current, description } =
      req.body;

    const newExp = {
      company,
      title,
      from,
      location,
      to,
      current,
      description,
    };

    try {
      let profile = await Profile.findOne({ _id: req.params.user_id });

      //update experience:

      console.log(req.params);
      console.log(profile.experience);

      profile = await Profile.findOneAndUpdate(
        { "experience.id": req.params.ex_id },
        { $set: { experience: newExp } },
        { new: true }
      );
      await profile.save();
      res.send({ profile });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        status: "Server error",
        message: error.message,
      });
    }
  }
);

// @route    DELETE /api/v1/admin/:user_id/experience/delete/:exp_id
// @desc     Delete experience details
// @access   private

router.delete("/:user_id/experience/delete/:ex_id", auth, async (req, res) => {
  try {
    console.log(req.params);
    let profile = await Profile.findOne({ _id: req.params.user_id });

    //delete experience:

    // console.log(profile);

    profile = await Profile.findOneAndUpdate(
      { "experience._id": req.params.ex_id },
      { $pull: { experience: { id: req.params.ex_id } } },
      { new: true }
    );
    await profile.save();
    res.send({ profile });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error.message,
    });
  }
});

// @route    PUT /api/v1/profile/education/new
// @desc     add profile education
// @access   private

router.put(
  "/education/new",
  auth,
  [
    check("school", "School name is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldOfStudy", "Field of study is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldOfStudy, from, to, current, description } =
      req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();

      res.json({ profile });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        status: "Server error",
        message: error,
      });
    }
  }
);

// @route    PUT /api/v1/profile/education/update/:exp_id
// @desc     update education details
// @access   private

router.put(
  "/education/update/:ex_id",
  auth,
  [
    check("school", "School name is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldOfStudy", "Field of study is required").not().isEmpty(),
    check("from", "from date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldOfStudy, from, to, current, description } =
      req.body;

    const newExp = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      //update education:

      profile = await Profile.findOneAndUpdate(
        { "education.id": req.params.ex_id },
        { $set: { education: newExp } },
        { new: true }
      );
      await profile.save();
      res.send({ profile });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        status: "Server error",
        message: error,
      });
    }
  }
);

// @route    DELETE /api/v1/profile/education/delete/:exp_id
// @desc     Delete education details
// @access   private

router.delete("/education/delete/:ex_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    //delete education:

    profile = await Profile.findOneAndUpdate(
      { "education.id": req.params.ex_id },
      { $pull: { education: { _id: req.params.ex_id } } },
      { new: true }
    );
    await profile.save();
    res.send({ profile });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error.message,
    });
  }
});

module.exports = router;
