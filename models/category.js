const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
//now we will create category schema

const categorySchema = new mongoose.Schema(
  {
    //name , slug , content , image , postedBy
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },
    image: {
      url: String,
      key: String,
    },
    content: {
      type: {},
      min: 20,
      max: 2000000,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
