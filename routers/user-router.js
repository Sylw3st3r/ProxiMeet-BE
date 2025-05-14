const express = require("express");

const usersController = require("../controllers/user-controller");

const router = express.Router();

router.put("/signup", usersController.signup);

router.post("/signin", usersController.signin);

router.get("/verify/:token", usersController.verify);

module.exports = router;
