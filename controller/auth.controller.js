const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Render Login Page
const getLoginPage = (req, res) => {
  res.render("users/Login", {
    title: "Login Page",
    isLoginPage: true,
  });
};

// Sign Up Logic
const SignUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.render("users/Login", {
        title: "Login Page",
        isLoginPage: true,
        signUpError: "All fields are required.",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.render("users/Login", {
        title: "Login Page",
        isLoginPage: true,
        signUpError: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

// Login Logic
const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render("users/Login", {
        title: "Login Page",
        isLoginPage: true,
        loginError: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("users/Login", {
        title: "Login Page",
        isLoginPage: true,
        loginError: "Invalid email. Please try again.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render("users/Login", {
        title: "Login Page",
        isLoginPage: true,
        loginError: "Invalid credentials. Please try again.",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    req.session.isAuthenticated = true;
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

// Logout Logic
const Logout = (req, res) => {
  res.clearCookie("authToken");
  req.session.isAuthenticated = false;
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out." });
    }
    res.clearCookie("connect.sid");
    res.redirect("/auth/login");
  });
};
module.exports = { Login, SignUp, Logout, getLoginPage };
