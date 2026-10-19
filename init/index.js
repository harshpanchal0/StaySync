require("dotenv").config({ path: __dirname + "/../.env" }); 
const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../models/listing");
const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async function () {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "6ad5a4a0671a4a6e438aee84",
  }));
  await Listing.insertMany(initData.data);
  console.log("data inserted successfully");

  mongoose.connection.close(); 
};

main()
  .then(() => {
    console.log("connected to DB");
    initDB(); 
  })
  .catch((err) => {
    console.log("Database connection failed:", err);
  });