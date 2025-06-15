//mongoose setup
const mongoose = require("mongoose");
const MONGO_URL = "mongodb://127.0.0.1:27017/staysync";
const initData = require("./data");
const Listing = require("../models/listing");

async function main() {
  await mongoose.connect(MONGO_URL);
}

main()
  .then((res) => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

//data insert in database
const initDB = async function () {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "681da7ea6a1e082fcd9f4797",
  }));
  await Listing.insertMany(initData.data);
  console.log("data inserted successfully");
};
initDB();
