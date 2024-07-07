//this file will contain all the properties any user will have such as name , email , password , salt
//salt defines level of hashing of any password

//importing the mongoose model
const mongoose = require("mongoose");
const crypto = require("crypto");
const { ObjectId } = mongoose.Schema;

//we will create the user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      max: 12,
      trim: true,
      index: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    role: {
      type: String,
      default: "subscriber",
    },
    resetPasswordLink: {
      type: String,
      default: "",
    },
    categories: [
      {
        type: ObjectId,
        ref: "Category",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

//timestamps:true will store the created at and updated at time
//now add virtual field to hash the password
//simple virtual ye krta hai kisi field ko modify krke schema mein save
userSchema
  .virtual("password")
  .set(function (password) {
    //in this password is what we get from user
    //create temporary variable password
    this._password = password;
    //generate salt (dummy bits)
    this.salt = this.makeSalt();
    //store the encrypted password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

//now we will create the methods authenticate , encrpytPassword, makeSalt
userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword: function (password) {
    //we need to encrypt the given password
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (error) {
      return "";
    }
  },
  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

//now we will export the model
module.exports = mongoose.model("User", userSchema);
