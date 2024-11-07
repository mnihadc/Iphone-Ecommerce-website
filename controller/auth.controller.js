const getLoginPage = (req, res, next) => {
  res.render("users/Login", {
    title: "Login Page",
    isLoginPage: true,
  });
};

module.exports = { getLoginPage };
