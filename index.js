const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const Error = require("./models/error");

const userRoutes = require("./routers/user-router");
const eventsRoutes = require("./routers/events-router");

app.use(bodyParser.json());

// Make images available for FE
app.use("/images", express.static("images"));

app.use(cors({ origin: "*" }));

app.use("/users", userRoutes);

app.use("/events", eventsRoutes);

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    errorDescription: error.errorDescription || "Unknown error has occured!",
  });
});

app.listen(process.env.PORT || 3001);
