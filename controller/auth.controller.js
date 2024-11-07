const User = require("../model/User");
const bcrypt = require("bcrypt");

const getLoginPage = (req, res, next) => {
  res.render("users/Login", {
    title: "Login Page",
    isLoginPage: true,
  });
};

const SignUp = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    console.log(username, email, password);
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).redirect("/auth/login");
  } catch (error) {
    next(error);
  }
};

const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    const userEmail = await User.findOne({ email: email });
    if (!userEmail) {
      return res
        .status(401)
        .json({ message: "Invalid credentials. Please try again." });
    }
    const isPasswordValid = await bcrypt.compare(password, userEmail.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid credentials. Please try again." });
    }
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};
module.exports = { getLoginPage, SignUp, Login };
