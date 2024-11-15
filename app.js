const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");
const homeRouter = require("./route/home.route");
const authRouter = require("./route/auth.route");
const profileRouter = require("./route/profile.route");
const addressRouter = require("./route/address.route");
const cartRouter = require("./route/cart.route");
const orderRouter = require("./route/order.route");
const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// MongoDB connection
const port = process.env.PORT_NO;
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
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 },
  })
);

app.engine(
  "hbs",
  exphbs.engine({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
  })
);
app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/user")));
app.use(express.static(path.join(__dirname, "public/css")));
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

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
