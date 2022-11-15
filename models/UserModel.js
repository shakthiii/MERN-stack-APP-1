const mongoose = require("mongoose");

const UserSchema = require("../schema/UserSchema");

// module.exports = User = mongoose.model("user", UserSchema);

// or

const User = mongoose.model("User", UserSchema);

module.exports = User;
