const { response } = require("express");
const express = require("express");
const { check, validationResult } = require("express-validator");
const request = require("request");

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
// @access   Private

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

// @route    DELETE /api/v1/profile
// @desc     Delete profile page, user and posts
// @access   Private => auth

router.delete("/", auth, async (req, res) => {
  try {
    //@todo removing user posts

    //removing profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //removing user in user route

    //message

    res.send(200).json("User deleted");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "Server error",
      message: error,
    });
  }
});

// @route    PUT /api/v1/profile/experience/new
// @desc     add profile experience
// @access   private

router.put(
  "/experience/new",
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
      const profile = await Profile.findOne({ user: req.user.id });
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

// @route    PUT /api/v1/profile/experience/update/:exp_id
// @desc     update experience details
// @access   private

router.put(
  "/experience/update/:ex_id",
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
      let profile = await Profile.findOne({ user: req.user.id });

      //update experience:

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
        message: error,
      });
    }
  }
);

// @route    DELETE /api/v1/profile/experience/delete/:exp_id
// @desc     Delete experience details
// @access   private

router.delete("/experience/delete/:ex_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    //delete experience:

    profile = await Profile.findOneAndUpdate(
      { "experience.id": req.params.ex_id },
      { $pull: { experience: { _id: req.params.ex_id } } },
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

// @route    GET /api/v1/profile/github/:userName
// @desc     get github repos
// @access   public

router.get("/github/:user_name", async ({ params }, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${params.user_name}/repos?per_page=5&sort=created:asc&client_id=${process.env.GITHUB_CLIENT}&client_secret=${process.env.GITHUB_SECRET}`,
      method: "GET",
      headers: {
        "user-agent": "node.js",
      },
    };
    request(options, (error, response, body) => {
      if (error) console.log(error.message);

      if (response.statusCode !== 200) {
        return res
          .status(404)
          .json({ errors: [{ message: "UserName not found!" }] });
      }
      res.send(JSON.parse(body));
    });
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
