const express = require("express");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
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

// @route    PUT /api/v1/users/posts/like/:post_id
// @desc     like users posts by ID
// @access   Private

router.put("/like/:post_id", auth, async (req, res) => {
  try {
    const posts = await Post.findOne({ id: req.params.post_id });
    // console.log(posts);

    if (
      posts.likes.filter((like) => like.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(400).json({ msg: "You already liked the post" });
    } else {
      posts.likes.unshift({ user: req.user.id });

      posts.save();
    }
    res.json(posts.likes);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

// @route    PUT /api/v1/users/posts/like/:post_id
// @desc     dislike users posts by ID
// @access   Private

router.put("/dislike/:post_id", auth, async (req, res) => {
  try {
    console.log(req.params.post_id);
    const post = await Post.findOne({ id: req.params.post_id });

    // console.log(post);

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    } else {
      const removeIndex = post.likes
        .map((like) => like.user.toString())
        .indexOf(req.user.id);
      post.likes.splice(removeIndex, 1);
    }

    res.json(post.likes);

    await post.save();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on a post
// @access  Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is not required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      return res.status(500).send("Server Error");
    }
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment on a post
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    if (comment.user_id.toString() !== req.user.id) {
      // 401 - User Not Authorized
      return res.status(401).json({ msg: "User not authorized" });
    }

    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Server error",
      message: error.message,
      error: error,
    });
  }
});

module.exports = router;
