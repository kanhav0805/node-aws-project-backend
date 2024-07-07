//initialize the express app
const express = require("express");
const app = express();
//now we need to add the other dependencies
const morgan = require("morgan"); //to get the routes in console
const bodyParser = require("body-parser"); //for conversion of json request body to js
const cors = require("cors"); //cross origin resource sharing to send data from one domain to another like lo/8000->lo/3000
const mongoose = require("mongoose"); //for mongoose data base
require("dotenv").config(); //to import the env file

//import the various routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const linkRoutes = require("./routes/link");

//we will connect the data base now
mongoose
  .connect(process.env.DATABASE_CLOUD, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

//now we will add the middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb", type: "application/json" }));

// app.use(cors());
//  this will allow any domain to make request to our server that is not useful
app.use(cors({ origin: process.env.CLIENT_URL }));

//now we can use various function of express middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", linkRoutes);

//we nee port to run any server
const port = process.env.PORT || 8000;

//now our app should listen to that port
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
