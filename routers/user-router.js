const express = require("express");

const usersController = require("../controllers/user-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.put("/signup", usersController.signup);

router.post("/signin", usersController.signin);

module.exports = router;
