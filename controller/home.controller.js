const getHomePage = (req, res, next) => {
  res.render("Home", {
    title: "Home Page",
    isHomePage: true,
  });
};

module.exports = {
  getHomePage,
};
