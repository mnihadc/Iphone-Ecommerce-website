const getHomePage = (req, res, next) => {
  res.render("users/Home", {
    title: "Home Page",
    isHomePage: true,
    user: req.session.user,
  });
};

module.exports = {
  getHomePage,
};
