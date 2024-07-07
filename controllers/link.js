const Link = require("../models/link");
const User = require("../models/user");
const Category = require("../models/category");
const AWS = require("aws-sdk");
const { linkPublishedParams } = require("../helpers/email");

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create new instance of SES
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.create = async (req, res) => {
  const { title, url, categories, type, medium } = req.body;
  const slug = url;
  let link = new Link({ title, url, categories, type, medium, slug });
  link.postedBy = req.auth._id;

  try {
    const data = await link.save();
    res.json(data);

    // Find all users in the category
    const users = await User.find({ categories: { $in: categories } }).exec();
    const result = await Category.find({ _id: { $in: categories } }).exec();
    data.categories = result;

    // Send emails to all users in the category
    for (let i = 0; i < users.length; i++) {
      const params = linkPublishedParams(users[i].email, data);
      try {
        const sendEmail = await ses.sendEmail(params).promise();
        console.log("email submitted to SES ", sendEmail);
      } catch (emailError) {
        console.log("error on email submitted to SES ", emailError);
      }
    }
  } catch (err) {
    res.status(400).json({
      message: "Link already exists or other error",
    });
  }
};

exports.list = async (req, res) => {
  let limit = req.body.limit ? parseInt(req.body.limit) : 10;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  try {
    const data = await Link.find({})
      .populate("postedBy", "name")
      .populate("categories", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    res.json(data);
  } catch (err) {
    res.status(400).json({
      error: "Could not list links",
    });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, url, categories, type, medium } = req.body;
  const updatedLink = { title, url, categories, type, medium };

  try {
    const updated = await Link.findOneAndUpdate({ _id: id }, updatedLink, {
      new: true,
    }).exec();

    if (!updated) {
      return res.status(400).json({
        error: "Error updating the link. Link not found.",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Error updating the link",
    });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  console.log("here", id, req.params);
  try {
    const data = await Link.findOneAndDelete({ _id: id }).exec();

    if (!data) {
      return res.status(400).json({
        error: "Error removing the link. Link not found.",
      });
    }

    res.json({
      message: "Link removed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Error removing the link",
    });
  }
};

exports.read = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Link.findOne({ _id: id }).exec();
    if (!data) {
      return res.status(404).json({
        error: "Link not found",
      });
    }
    res.json(data);
  } catch (err) {
    res.status(400).json({
      error: "Error finding link",
    });
  }
};

exports.clickCount = async (req, res) => {
  //now we will add api to increase click count
  const { linkId } = req.body;
  try {
    const result = await Link.findByIdAndUpdate(
      linkId,
      { $inc: { clicks: 1 } },
      { new: true }
    ).exec();
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: "Could not update view count",
    });
  }
};
