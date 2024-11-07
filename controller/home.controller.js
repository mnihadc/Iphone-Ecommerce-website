const getHomePage = (req, res, next) => {
  res.render("users/home", {
    title: "Home Page",
    isHomePage: true,
  });
};

module.exports = {
  getHomePage,
};
