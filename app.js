const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const cors = require("cors");
const GoogleStrategy = require("passport-google-oauth20");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const homeRouter = require("./route/home.route");
const authRouter = require("./route/auth.route");
const profileRouter = require("./route/profile.route");
const addressRouter = require("./route/address.route");
const cartRouter = require("./route/cart.route");
const bodyParser = require("body-parser");
const orderRouter = require("./route/order.route");
const wishlistRouter = require("./route/wishlist.route");
const cookieParser = require("cookie-parser");
const User = require("./model/User");
const authenticateUser = require("./middleware/verifyToken");
const NodeCache = require("node-cache");

const app = express();
dotenv.config();

// Initialize cache with a default TTL of 3600 seconds (1 hour)
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
const port = process.env.PORT_NO || 3000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://iphone-ecommerce-website.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0]?.value,
          });
          await user.save();
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Middleware to prevent cache for protected routes
app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Routes for Google authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  (req, res) => {
    res.cookie("authToken", req.user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });
    res.render("users/ContactUs", {
      title: "Contact Us",
      isContactUsPage: true,
      user: req.user,
    });
  }
);

// Logout route
app.get("/logout", (req, res) => {
  const cacheKey = `user_${req.user?.userId}`;
  myCache.del(cacheKey);
  res.clearCookie("authToken");
  res.redirect("/login");
});

// Middleware for JWT authentication
app.use(authenticateUser);

// Set Handlebars as view engine
const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views/layouts"),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  },
  helpers: {
    eq: (a, b) => a === b,
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/user")));
app.use(express.static(path.join(__dirname, "public/css")));

// Caching example
app.get("/some-route", (req, res) => {
  const cacheKey = "someData";
  const cachedData = myCache.get(cacheKey);

  if (cachedData) {
    return res.json({ data: cachedData, fromCache: true });
  }

  const data = { message: "This is the data from the database" };
  myCache.set(cacheKey, data);

  res.json({ data, fromCache: false });
});

// Routes
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/address", addressRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/wishlist", wishlistRouter);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on port 3000");
});
