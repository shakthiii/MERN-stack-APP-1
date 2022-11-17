const express = require("express");
const { check, validationResult } = require("express-validator");

const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/ProfileModel");
const User = require("../../models/UserModel");

// @route    POST /api/v1/users/profile
// @desc     create or update User profile
// @access   private

router.post(
  "/",
  [
    auth,
    [
      check("status", "status is required").not().isEmpty(),
      check("skills", "skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // res.json(req.body);

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubUsername,
      youTube,
      twitter,
      linkedIn,
      facebook,
      instagram,
    } = req.body;

    //building the user profile

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubUsername) profileFields.githubUsername = githubUsername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    //building the social profile

    profileFields.social = {};

    if (youTube) profileFields.social.youTube = youTube;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedIn) profileFields.social.linkedIn = linkedIn;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //Update Profile

        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json({ profile });
      }

      //Create profile
      profile = new Profile(profileFields);

      await profile.save();

      res.json({ profile });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        status: "Server error",
        message: error,
      });
    }
  }
);

// @route    get/api/v1/users/profile/me
// @desc     get User profile
// @access   Public

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

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

// module.exports = router;

// @route    GET /api/v1/users/profile
// @desc     get all profiles
// @access   public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

// @route    GET /api/v1/profile/users/:id
// @desc     get all profiles
// @access   public

router.get("/users/:user_id", async ({ params }, res) => {
  try {
    const profile = await Profile.findOne({
      user: params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ message: "Profile not found!" }] });
    }
    res.status(200).json({ profile });
  } catch (err) {
    console.log(err.message);
    if (err.kind == "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ message: "Profile not found!" }] });
    }
    res.status(500).json({
      status: "Server error",
      message: err,
    });
  }
});

module.exports = router;
