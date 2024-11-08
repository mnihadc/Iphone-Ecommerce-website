const getHomePage = (req, res, next) => {
  res.render("users/home", {
    title: "Home Page",
    isHomePage: true,
    user: req.session.user,
  });
};

module.exports = {
  getHomePage,
};
