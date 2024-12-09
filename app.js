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
const cookieParser = require("cookie-parser");
const User = require("./model/User");
const authenticateUser = require("./middleware/verifyToken");
const app = express();
dotenv.config();

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateUser);

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
    origin: "http://localhost:3000", // Your frontend's URL
    credentials: true, // Allow credentials (cookies)
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
      scope: ["profile", "email"], // Ensure to request profile and email
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

// Routes for Google authentication
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }), // <-- session: false added
  (req, res) => {
    // Successful login
    res.cookie("authToken", req.user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Make sure to set to true in production
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });
    res.render("users/ContactUs", {
      title: "Contact Us",
      isContactUsPage: true,
      user: req.user, // Use token-based user
    });
  }
);
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

// JWT Middleware for Protected Routes

// Routes
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/address", addressRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
