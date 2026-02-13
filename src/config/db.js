const mongoose = require("mongoose");
const { dbUrl } = require("./env");

async function connectDb() {
  await mongoose.connect(dbUrl);
  console.log("MongoDB connected");
}

module.exports = { connectDb };
