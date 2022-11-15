const express = require("express");

const router = express();

const auth = require("../routers/api/auth");
const post = require("../routers/api/post");
const profile = require("../routers/api/profile");
const user = require("../routers/api/user");

router.route("/").get(user);

router.route("/post").get(post);
router.route("/profile").get(profile);
router.route("/auth").get(auth);

module.exports = router;
