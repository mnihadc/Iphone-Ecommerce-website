const getProfile = (req, res, next) => {
  res.render("users/Profile", {
    title: "Profile Page",
    isProfilePage: true,
    user: req.session.user,
  });
};

module.exports = { getProfile };
