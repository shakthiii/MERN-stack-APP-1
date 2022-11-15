const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const DB_Connection = require("./models/Database");
const userRoute = require("./routers/userRoute");

dotenv.config({ path: "./config.env" });

const app = express();

const PORT = process.env.PORT || 6000;

// console.log(process.env);

DB_Connection();

//Define routes

app.use("/api/v1/users", userRoute);

app.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});
