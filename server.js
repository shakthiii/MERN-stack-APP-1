const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const DB_Connection = require("./Database");
const userRoute = require("./routers/userRoute");

dotenv.config({ path: "./config.env" });

const app = express();

const PORT = process.env.PORT || 6000;

DB_Connection();

//Initializing middleware => body parser in express

app.use(express.json());

//Define routes

app.use("/api/v1/users", userRoute);

//listening

app.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});
