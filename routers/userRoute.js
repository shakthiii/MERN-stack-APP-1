const express = require("express");

const router = express();

const auth = require("../routers/api/auth");
const post = require("../routers/api/post");
const profile = require("../routers/api/profile");
const user = require("../routers/api/user");
const loginRoute = require("./api/loginAuth");

router.route("/").post(user);

router.route("/post").get(post);
router.route("/profile").get(profile);
router.route("/auth").post(loginRoute).get(auth);

module.exports = router;
