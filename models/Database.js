const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });
const Data = process.env.DATABASE;

const DB = Data.replace("<password>", process.env.PASSWORD);

const Database = async () => {
  try {
    await mongoose.connect(DB);

    console.log("DATABASE connected successfully");
  } catch (err) {
    console.log(err);
    console.log(err.message);

    process.exit(1);
  }
};

module.exports = Database;
