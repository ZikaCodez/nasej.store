const express = require("express");
const { uploadImage, uploadMiddleware } = require("../controllers/image");

const router = express.Router();

// POST /api/image - upload a single image file (field: "image")
router.post("/", uploadMiddleware, uploadImage);

module.exports = router;
