const AWS = require("aws-sdk");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt");
// const nanoid = require("nanoid");
const _ = require("lodash");
const {
  registerEmailParams,
  forgotPasswordEmailParams,
} = require("../helpers/email");

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create new instance of SES
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

async function generateNanoid() {
  const { nanoid } = await import("nanoid");
  return nanoid();
}

exports.register = async (req, res) => {
  console.log("REGISTER CONTROLLER", process.env.AWS_ACCESS_KEY_ID, req.body);
  const { name, email, password, categories } = req.body;

  try {
    // Check if the user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "Email Is Already Taken" });
    }

    // // Generate jwt token with email and password
    const token = jwt.sign(
      { name, email, password, categories },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: "10m" }
    );

    // Generate the params to send in the email
    const params = registerEmailParams(email, token);

    // Send email using the params
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("Email submitted to SES", data);
        res.status(200).json({
          message: `Email has been sent to ${email}, Follow the instructions to complete your registration`,
        });
      })
      .catch((error) => {
        console.log("SES email on register error", error);
        res.status(500).json({
          message: `We could not verify your email. Please try again`,
        });
      });
  } catch (error) {
    console.error("Error in registration", error);
    res.status(500).send("Server error");
  }
};

exports.registerActivate = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);
    } catch (error) {
      return res.status(401).json({
        message: "Expired Link Or Invalid Token. Try Again",
      });
    }

    const { name, email, password, categories } = decoded;

    // Create unique user name string with nanoid
    const username = await generateNanoid();
    console.log(username, "user name");

    // Check if the user already exists with the same email
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ message: "Email is already taken" });
    }

    // Create a new user instance
    const newUser = new User({
      username,
      name,
      email,
      password,
      categories,
    });
    console.log(categories, "categories");

    // Save the user to the database
    try {
      await newUser.save();
      return res
        .status(200)
        .json({ message: "Registration successful. Please Login" });
    } catch (err) {
      return res.status(401).json({
        message: "Error while saving the user in database. Try later",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later" });
  }
};
exports.login = async (req, res) => {
  try {
    //here we will get the user datails enetered
    const { email, password } = req.body;
    //now we will check if user with this email exists then we will login and send the jwt token and user details in response
    const user = await User.findOne({ email });
    console.table({ email, password, user });
    if (!user) {
      return res.status(401).json({
        message: "User with that email does not exist. Please register.",
      });
    }
    //now we will check if user have entered correct password or not
    if (!user.authenticate(password)) {
      return res
        .status(401)
        .json({ message: "Wrong email and password entered" });
    }
    //then we will create jwt token using email and password
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const { _id, name, email: savedEmail, role } = user;

    return res.status(200).json({
      token,
      user: { _id, name, savedEmail, role },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong.Please try again later" });
  }
};

//we will add a middleware ro check the validity of the login token

exports.requireSignIn = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
}); //value decoded using req.auth

//auth middleware that will run after require sign in
exports.authMiddleware = async (req, res, next) => {
  try {
    // Ensure req.user is defined
    if (!req.auth || !req.auth._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    //first get the user id from the response of previous middleware
    const userId = req.auth?._id;
    //now we will find the user from db with given id
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    //save the user in req
    req.profile = user;
    next();
  } catch (error) {
    res.status(400).json({ message: `Something went wrong.${error.message}` });
  }
};

//admin middleware
exports.adminMiddleware = async (req, res, next) => {
  try {
    // Ensure req.user is defined
    if (!req.auth || !req.auth._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    //first get the user id from the response of previous middleware
    const userId = req.auth._id;
    //now we will find the user from db with given id
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ message: "Admin resource.Access Denied" });
    }

    //save the user in req
    req.profile = user;
    next();
  } catch (error) {
    res.status(400).json({ message: `Something went wrong.${error.message}` });
  }
};

exports.forgotPassword = async (req, res) => {
  // Firstly, we will get the email from the req.body
  const { email } = req.body;

  // Now find if the user with the passed email exists
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res
        .status(400)
        .json({ message: "User with provided email id does not exist" });
    }

    // If the user exists, generate a JWT token
    const token = jwt.sign(
      { name: user.name },
      process.env.JWT_RESET_PASSWORD,
      { expiresIn: "10m" }
    );

    // Get the email params
    const params = forgotPasswordEmailParams(email, token);

    // Update the reset password link in the database and send an email to the user
    try {
      const user1 = await User.findOneAndUpdate(
        { email },
        { resetPasswordLink: token },
        { new: true }
      );

      if (!user1) {
        return res.status(400).json({
          error: "Password reset failed. Try later.",
        });
      }

      // Send email using SES
      const sendEmail = ses.sendEmail(params).promise();
      const data = await sendEmail;

      console.log("SES reset password success", data);
      return res.json({
        message: `Email has been sent to ${req.body.email}. Click on the link to reset your password`,
      });
    } catch (error) {
      console.log("Error during password reset:", error);
      return res.status(400).json({
        message: `We could not verify your email. Try later.`,
      });
    }
  } catch (error) {
    console.log("Error finding user:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  //get the newPaswword and resetPassword link from the body
  const { resetPasswordLink, newPassword } = req.body;
  try {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      async (error, decoded) => {
        if (error) {
          return res
            .status(400)
            .json({ message: "Token Expired.Pls try again" });
        }
        //now we will query the db with the following reset password link
        let user = await User.findOne({ resetPasswordLink });
        if (!user) {
          return res
            .status(400)
            .json({ message: "Invalid token.Pls Try again" });
        }
        //now if the token is correct we need to save the new password in db
        const updatedFields = {
          password: newPassword,
          resetPasswordLink: "",
        };
        //now we will use lodash to update only few fields in the user schema
        user = _.extend(user, updatedFields);
        try {
          await user.save();
          res.status(200).json({
            message:
              "Password reset successful. Please Login with new password now",
          });
        } catch (err) {
          res.status(401).json({
            message: "Error updating the password. Try later",
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong. Try later",
    });
  }
};

//create update delete middleware
exports.canUpdateDeleteLink = async (req, res, next) => {
  const { id } = req.params;
  try {
    const data = await Link.findOne({ _id: id }).exec();
    if (!data) {
      return res.status(400).json({
        error: "Could not find link",
      });
    }
    const authorizedUser =
      data.postedBy._id.toString() === req.user._id.toString();
    if (!authorizedUser) {
      return res.status(400).json({
        error: "You are not authorized",
      });
    }
    next();
  } catch (err) {
    res.status(400).json({
      error: "Could not find link",
    });
  }
};
