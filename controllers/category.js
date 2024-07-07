const Category = require("../models/category");
const Link = require("../models/link");
const slugify = require("slugify");
const formidable = require("formidable");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const fs = require("fs");

// s3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// exports.create = async (req, res) => {
//   const form = new formidable.IncomingForm();

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error("Form parse error:", err);
//       return res.status(400).json({
//         error: "Image could not be uploaded",
//       });
//     }

//     console.log("Fields:", fields);
//     console.log("Files:", files);

//     const name = Array.isArray(fields.name) ? fields.name[0] : fields.name; // Ensure name is a string
//     const { content } = fields;
//     const image = files.image ? files.image[0] : null;

//     console.log(image);
//     if (!image || !image.filepath) {
//       console.error("No image or invalid path");
//       return res.status(400).json({
//         error: "No image was uploaded or the path is invalid",
//       });
//     }

//     if (image.size > 2000000) {
//       console.error("Image size exceeds limit");
//       return res.status(400).json({
//         error: "Image should be less than 2MB",
//       });
//     }

//     const slug = slugify(name);
//     const category = new Category({ name, content, slug });

//     try {
//       const fileContent = fs.readFileSync(image.filepath);
//       console.log("File content read successfully");

//       const params = {
//         Bucket: "hackr-kanhav",
//         Key: `category/${uuidv4()}`,
//         Body: fileContent,
//         // ACL: "public-read",
//         ContentType: `image/jpg`,
//       };

//       const data = await s3.upload(params).promise();
//       console.log("AWS UPLOAD RES DATA", data);

//       category.image.url = data.Location;
//       category.image.key = data.Key;

//       const savedCategory = await category.save();
//       console.log("Category saved to DB successfully");
//       return res.json(savedCategory);
//     } catch (err) {
//       console.error("S3 upload or DB save error:", err);
//       return res.status(400).json({
//         message: "Upload to S3 or saving to DB failed",
//       });
//     }
//   });
// };

exports.create = async (req, res) => {
  const { name, image, content } = req.body;
  //we will convert the image to base 64 image

  const base64Data = new Buffer.from(
    image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  //we can also get the type of image
  const type = image.split(";")[0].split("/")[1];
  const slug = slugify(name);
  let category = new Category({ name, content, slug });

  try {
    console.log("File content read successfully");

    const params = {
      Bucket: "hackr-kanhav",
      Key: `category/${uuidv4()}.${type}`,
      Body: base64Data,
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    const data = await s3.upload(params).promise();
    console.log("AWS UPLOAD RES DATA", data);

    category.image.url = data.Location;
    category.image.key = data.Key;
    category.postedBy = req.auth._id;

    const savedCategory = await category.save();
    console.log("Category saved to DB successfully");
    return res.json(savedCategory);
  } catch (err) {
    console.error("S3 upload or DB save error:", err);
    return res.status(400).json({
      message: "Upload to S3 or saving to DB failed",
    });
  }
};

exports.list = async (req, res) => {
  try {
    //we will find all the categories and send it as reponse
    const response = await Category.find({});
    if (!response) {
      return res
        .status(400)
        .json({ message: "No categories present at moment" });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong.Error in fetching the categories",
    });
  }
};

exports.read = async (req, res) => {
  const { slug } = req.params;
  let limit = req.body.limit ? parseInt(req.body.limit) : 2;
  let skip = req.body.skip ? parseInt(req.body.skip) : 0;

  try {
    const category = await Category.findOne({ slug })
      .populate("postedBy", "_id name username")
      .exec();
    if (!category) {
      return res.status(400).json({ error: "Could not load category" });
    }

    const links = await Link.find({ categories: category })
      .populate("postedBy", "_id name username")
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    res.json({ category, links });
  } catch (err) {
    res.status(400).json({ error: "Could not load links of a category" });
  }
};

exports.update = async (req, res) => {
  const { slug } = req.params;
  const { name, image, content } = req.body;

  try {
    const updated = await Category.findOneAndUpdate(
      { slug },
      { name, content },
      { new: true }
    ).exec();

    if (!updated) {
      return res.status(400).json({
        error: "Could not find category to update",
      });
    }
    console.log("UPDATED", updated);

    if (image) {
      // remove the existing image from s3 before uploading new/updated one
      const deleteParams = {
        Bucket: "hackr-kanhav",
        Key: `category/${updated.image.key}`,
      };

      await s3.deleteObject(deleteParams).promise();
      console.log("S3 DELETED DURING UPDATE");

      // handle upload image
      const base64Data = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const type = image.split(";")[0].split("/")[1];

      const uploadParams = {
        Bucket: "hackr-kanhav",
        Key: `category/${uuidv4()}.${type}`,
        Body: base64Data,
        ContentEncoding: "base64",
        ContentType: `image/${type}`,
      };

      const data = await s3.upload(uploadParams).promise();
      console.log("AWS UPLOAD RES DATA", data);

      updated.image.url = data.Location;
      updated.image.key = data.Key;

      const success = await updated.save();
      res.json(success);
    } else {
      res.json(updated);
    }
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "An error occurred while updating the category" });
  }
};

exports.remove = async (req, res) => {
  const { slug } = req.params;
  console.log("Received slug:", slug); // Debugging log

  try {
    const data = await Category.findOneAndDelete({ slug }).exec();
    console.log("Category data:", data); // Debugging log

    if (!data) {
      return res.status(400).json({
        message: "Could not delete category",
      });
    }

    const deleteParams = {
      Bucket: "hackr-kanhav",
      Key: `${data.image.key}`,
    };

    const deleteResult = await s3.deleteObject(deleteParams).promise();
    console.log("S3 DELETED DURING", deleteResult); // Debugging log

    res.json({
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: "An error occurred while deleting the category",
    });
  }
};
