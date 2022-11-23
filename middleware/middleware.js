const express = require("express");
const { check, validationResult } = require("express-validator");

const router = express.Router();
// const auth = require("../../middleware/auth");
const Profile = require("../models/ProfileModel");
const User = require("../models/UserModel");

const authUser = async (req, res, next) => {
  console.log(req.user);
  const profile = await User.findOne({ _id: req.user.id });

  //   console.log(profile);

  //   console.log(profile.role);

  if (profile.role !== "Admin") {
    return res.status(403).json({ error: "Your are unauthorized" });
  }
  next();
};

module.exports = {
  authUser,
};
