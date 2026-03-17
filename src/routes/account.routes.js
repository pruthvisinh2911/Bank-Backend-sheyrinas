const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controller/account.controller")


const router = express.Router()

router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountscontroller)

module.exports = router