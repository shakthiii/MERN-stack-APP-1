const express = require("express");

const router = express.Router();
const auth = require("../../../middleware/auth");
const Profile = require("../../../models/ProfileModel");
const User = require("../../../models/UserModel");

// @route    get/api/v1/users/profile/me
// @desc     get User profile
// @access   Public

router.get("/profile/me", auth, async (req, res) => {
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

module.exports = router;
