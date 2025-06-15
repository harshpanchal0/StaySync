const express = require("express");
const app = express();
const port = 3000;

if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
}

main()
  .then((res) => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

const multer = require("multer");
const { storage } = require("./cloudConfig");
const upload = multer({ storage });

const passport = require("passport");
const LocalStrategy = require("passport-local");
const {
  isLoggedIn,
  isOwner,
  validateListing,
  validateReview,
  isReviewAuthor,
} = require("./middleware");

const session = require("express-session");
const flash = require("connect-flash");

const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");
const { saveRedirectUrl } = require("./middleware");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.listen(port, () => {
  console.log(`${port} is listening`);
});

const ejs = require("ejs");
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

const wrapAsync = require("./utils/wrapAsync");
const listingController = require("./controllers/listings");
const reviewController = require("./controllers/reviews");
const userController = require("./controllers/users");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.get("/", listingController.root);

app
  .route("/listings")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.create)
  );

app.get("/listings/new", isLoggedIn, listingController.new);

app
  .route("/listings/:id")
  .get(wrapAsync(listingController.show))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.update)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.delete));

app.get(
  "/listings/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.edit)
);

app.post(
  "/listings/:id/reviews",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.review)
);

app.delete(
  "/listings/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.delete)
);

app
  .route("/signup")
  .get(userController.renderUser)
  .post(wrapAsync(userController.signup));

app
  .route("/login")
  .get(userController.renderLogin)
  .post(
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login
  );

app.get("/logout", userController.logout);

const engine = require("ejs-mate");
app.engine("ejs", engine);

const ExpressError = require("./utils/ExpressError");

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong!" } = err;
  res.status(status).render("error", { message });
});
