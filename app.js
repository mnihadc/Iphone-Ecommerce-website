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
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0]?.value,
          });
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
