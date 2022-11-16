const express = require("express");

const router = express();

const auth = require("../routers/api/auth");
const post = require("../routers/api/post");
const myProfile = require("./api/profile/myProfile");
const profile = require("./api/profile/profile");
const user = require("../routers/api/user");
const loginRoute = require("./api/loginAuth");

router.route("/").post(user);

router.route("/post").get(post);
router.route("/profile").post(profile);
router.route("/profile/me").get(myProfile);
router.route("/auth").post(loginRoute).get(auth);

module.exports = router;
