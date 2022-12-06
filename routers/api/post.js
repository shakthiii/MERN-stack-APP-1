const express = require("express");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const Profile = require("../../models/ProfileModel");
const Post = require("../../models/PostModel");
const User = require("../../models/UserModel");

const UserSchema = require("../../schema/UserSchema");

const router = express.Router();

// @route    get/api/v1/users/post
// @desc     Create Post
// @access   Private

router.post(
  "/",
  [auth, [check("text", "text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findById(req.user.id).select("--password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      console.log(newPost);
      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        status: "Server error",
        message: error.message,
        error: error,
      });
    }
  }
);

module.exports = router;
