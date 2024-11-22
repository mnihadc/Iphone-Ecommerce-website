const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const cors = require("cors");
const GoogleStrategy = require("passport-google-oauth20");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Import the session store
const mongoose = require("mongoose");
const homeRouter = require("./route/home.route");
const authRouter = require("./route/auth.route");
const profileRouter = require("./route/profile.route");
const addressRouter = require("./route/address.route");
const cartRouter = require("./route/cart.route");
const bodyParser = require("body-parser");
const orderRouter = require("./route/order.route");
const app = express();
dotenv.config();

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
const cookieParser = require("cookie-parser");
const User = require("./model/User");
app.use(cookieParser());
app.use(cors());
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
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't save uninitialized sessions
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB URI from environment
      ttl: 14 * 24 * 60 * 60, // Session expiration time (14 days)
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 3600000, // Cookie expiration (1 hour)
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // If the user doesn't exist, create a new record
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value, // Primary email
            profileImage: profile.photos[0]?.value, // Google profile picture
          });
          await user.save();
        }
        // Pass the user object and accessToken to the session
        return done(null, { user, accessToken });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize the user ID into the session
passport.serializeUser((user, done) => {
  done(null, user.user._id); // Store user ID in the session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Fetch user from the database based on the ID
  } catch (error) {
    done(error, null);
  }
});

const hbs = exphbs.create({
  extname: "hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views/layouts"),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
  },
  helpers: {
    eq: (a, b) => a === b, // Custom "eq" helper
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs"); // Set the default view engine

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/user")));
app.use(express.static(path.join(__dirname, "public/css")));
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  async (req, res) => {
    try {
      // Create JWT token
      const token = jwt.sign(
        { userId: req.user.user._id }, // Include user ID in the JWT
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Store JWT in a cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000, // Cookie expires in 1 hour
      });

      // Store user in session
      req.session.isAuthenticated = true;
      req.session.user = {
        id: req.user.user._id,
        username: req.user.user.username,
        email: req.user.user.email,
      };

      // Redirect to profile page
      res.redirect("/profile/user");
    } catch (error) {
      console.error("Error generating JWT:", error);
      res.redirect("/auth/login");
    }
  }
);
// Routes
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/address", addressRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
