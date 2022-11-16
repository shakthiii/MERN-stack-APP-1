const mongoose = require("mongoose");

const ProfileSchema = require("../schema/ProfileSchema");

// module.exports = User = mongoose.model("user", UserSchema);

// or

const Profile = mongoose.model("Profile", ProfileSchema);

module.exports = Profile;
