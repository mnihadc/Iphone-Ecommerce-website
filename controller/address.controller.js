const getCreateAddressPage = (req, res, next) => {
  res.render("users/CreateAddress", {
    title: "Address Page",
    isAddressPage: true,
    user: req.session.user,
  });
};

module.exports = {
  getCreateAddressPage,
};
