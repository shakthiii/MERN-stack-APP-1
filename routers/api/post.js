const express = require("express");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const Profile = require("../../models/ProfileModel");
const Post = require("../../models/PostModel");
const User = require("../../models/UserModel");

const UserSchema = require("../../schema/UserSchema");

const router = express.Router();

// @route    POST /api/v1/users/posts
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
      // console.log(newPost);
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

// @route    GET /api/v1/users/posts
// @desc     get all users posts
// @access   Private

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().select("-user").sort({ date: -1 });
    res.json({
      post: posts.length,
      posts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

// @route    GET /api/v1/users/posts/:id
// @desc     get single post
// @access   Private

router.get("/:post_id", async (req, res) => {
  try {
    const userPost = await Post.findById(req.params.post_id);
    if (!userPost) {
      res.status(404).json({ msg: "User post not found!" });
    }
    res.status(200).json(userPost);
  } catch (error) {
    console.log(error);
    if (error.kind === "ObjectId") {
      res.status(404).json({ msg: "User post not found!" });
    }
    res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

// @route    DELETE /api/v1/users/posts
// @desc     delete users posts by ID
// @access   Private

router.delete("/delete/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: "post not found" });
    }
    // console.log(User);
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "You are unauthorized!" });
    } else {
      await post.remove();
      res.status(201).json({ msg: "successfully deleted" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
