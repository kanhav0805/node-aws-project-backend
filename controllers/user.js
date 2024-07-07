const User = require("../models/user");
const Link = require("../models/link");

exports.read = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.auth._id }).exec();
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    const links = await Link.find({ postedBy: user })
      .populate("categories", "name slug")
      .populate("postedBy", "name")
      .sort({ createdAt: -1 })
      .exec();

    user.hashed_password = undefined;
    user.salt = undefined;

    res.json({ user, links });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Could not retrieve user or links",
    });
  }
};
