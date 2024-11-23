const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // For OTP generation
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

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

// Logout Logic
const Logout = (req, res) => {
  res.clearCookie("authToken");
  res.redirect("/auth/login");
};

const forgotPassword = (req, res) => {
  res.render("users/ForgotPassword", {
    title: "Forgot Password",
    isForgotPasswordPage: true,
  });
};

// Handle Forgot Password Logic (Send OTP to email)
const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Please enter your email." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No account found with that email address." });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = otp;
    user.otpExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}. It expires in 15 minutes.`,
    });

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "There was an error processing your request." });
  }
};

const handleOtpVerification = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate inputs
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found with the provided email." });
    }

    // Validate OTP and check expiration
    const isOtpValid = user.otp === otp && Date.now() <= user.otpExpire;
    if (!isOtpValid) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    // Return success response
    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while verifying OTP." });
  }
};

const getResetPassword = (req, res, next) => {
  res.render("users/resetPassword", {
    title: "Create New Password",
    isResetPasswordPage: true,
    email: req.query.email,
  });
};

// Handle the password reset logic
const handleResetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.render("users/resetPassword", {
        title: "Create New Password",
        error: "Both password fields are required.",
        email,
      });
    }

    if (password !== confirmPassword) {
      return res.render("users/resetPassword", {
        title: "Create New Password",
        error: "Passwords do not match.",
        email,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("users/resetPassword", {
        title: "Create New Password",
        error: "No user found with that email address.",
        email,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    user.otp = null; // Clear OTP after successful reset
    user.otpExpire = null; // Clear OTP expiry
    await user.save();

    // Send the user to the login page after successful password reset
    res.redirect("/auth/login");
  } catch (error) {
    console.error(error);
    res.status(500).render("users/resetPassword", {
      title: "Create New Password",
      error: "There was an error resetting your password.",
      email,
    });
  }
};

module.exports = {
  Login,
  SignUp,
  Logout,
  getLoginPage,
  forgotPassword,
  handleForgotPassword,
  handleOtpVerification,
  getResetPassword,
  handleResetPassword,
};
