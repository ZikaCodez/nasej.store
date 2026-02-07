const express = require("express");
const router = express.Router();

const {
  createColor,
  getColorById,
  listColors,
  updateColor,
} = require("../controllers/colors");

const {
  requireJsonContent,
  parseQueryOptions,
  validateStringIdParam,
  validateColorCreate,
  validateColorUpdate,
  requireAdmin,
  asyncHandler,
} = require("../core/middleware");

// Public: list colors
router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listColors(req.queryFilter || {}, req.queryOptions);
    res.json(result);
  }),
);

// Public: get color by id
router.get(
  "/:id",
  validateStringIdParam("id"),
  asyncHandler(async (req, res) => {
    const color = await getColorById(req.validStringId);
    res.json(color);
  }),
);

// Admin: create color
router.post(
  "/",
  requireJsonContent,
  requireAdmin,
  validateColorCreate,
  asyncHandler(async (req, res) => {
    const color = await createColor(req.body);
    res.status(201).json(color);
  }),
);

// Admin: update color
router.patch(
  "/:id",
  requireJsonContent,
  requireAdmin,
  validateStringIdParam("id"),
  validateColorUpdate,
  asyncHandler(async (req, res) => {
    const color = await updateColor(req.validStringId, req.body);
    res.json(color);
  }),
);

module.exports = router;
