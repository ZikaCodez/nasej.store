const axios = require("axios");
const multer = require("multer");
const upload = multer();
const uploadMiddleware = upload.single("image");

/**
 * Upload an image to freeimage.host (accepts multipart/form-data)
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} The uploaded image URL
 */
const uploadImage = async (req, res) => {

  // Check if the file exists
  if (!req.file || !req.file.buffer) {
    return res
      .status(400)
      .json({ status: "error", message: "No image file provided" });
  }

  // Verify file type
  if (!req.file.mimetype.startsWith("image/")) {
    return res
      .status(400)
      .json({ status: "error", message: "File must be an image" });
  }

  // Check file size (limit to 25MB to match UserAvatar)
  if (req.file.size > 25 * 1024 * 1024) {
    return res
      .status(400)
      .json({
        status: "error",
        message: "Image file size must be less than 25MB",
      });
  }

  try {
    // Convert buffer to base64
    const base64Data = req.file.buffer.toString("base64");

    // Create form data
    const formData = new URLSearchParams();
    formData.append("key", "6d207e02198a847aa98d0a2a901485a5");
    formData.append("source", base64Data);
    formData.append("format", "json");

    // Make POST request with form data
    const response = await axios.post(
      "https://freeimage.host/api/1/upload",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 60000, // 60 second timeout (increased from 15s to match frontend)
      },
    );

    if (response.data.status_code === 200 && response.data.image) {
      return res.status(200).json({
        status: "success",
        data: {
          url: response.data.image.url,
        },
      });
    }

    console.error("Failed to upload image:", response.data);
    return res.status(500).json({
      status: "error",
      message: "Failed to upload image to hosting service",
    });
  } catch (error) {
    console.error("Error uploading image:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to process image upload: " + error.message,
    });
  }
};

module.exports = {
  uploadImage,
  uploadMiddleware,
};
