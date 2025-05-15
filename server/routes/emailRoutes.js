const express = require("express");
const { sendEmails, cancelEmailProcess } = require("../controllers/emailController");

const router = express.Router();

router.post("/send", sendEmails);
router.post("/cancel", cancelEmailProcess); // New route to cancel process

module.exports = router;
