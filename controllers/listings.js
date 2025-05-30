const Listing = require("../models/listing");

module.exports.root = (req, res) => {
  res.redirect("/listings");
};

module.exports.index = async (req, res) => {
  const listings = await Listing.find();
  res.render("listings/index", { listings });
};

module.exports.new = (req, res) => {
  res.render("listings/new");
};

module.exports.show = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show", { listing });
};

module.exports.create = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;

  const listing = new Listing(req.body.listing);
  listing.owner = req.user._id;
  listing.image = { url, filename };
  await listing.save();
  req.flash("success", "New Listing Created");
  res.redirect("/listings");
};

module.exports.edit = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit", { listing, originalImageUrl });
};

module.exports.update = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.delete = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};

module.exports.index = async (req, res) => {
  const query = req.query.q;
  let listings;

  if (query) {
    const regex = new RegExp(query, "i");
    listings = await Listing.find({
      $or: [{ title: regex }, { location: regex }],
    });
  } else {
    listings = await Listing.find({});
  }

  res.render("listings/index", { listings, query });
};
