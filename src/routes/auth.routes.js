const express = require("express")
const authController = require("../controller/auth.controller")
const Router = express.Router()



Router.post("/register",authController.userRegisterController)

Router.post("/login",authController.userLoginController)

Router.post("/logout",authController.userLogoutController)

module.exports = Router