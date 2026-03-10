const express = require("express")
const authController = require("../controller/auth.controller")
const Router = express.Router()



Router.post("/register",authController.userRegisterController)

Router.post("/login",authController.userLoginController)

module.exports = Router