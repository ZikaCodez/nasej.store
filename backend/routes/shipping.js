const express = require("express");
const router = express.Router();

const {
  createShipping,
  getShippingById,
  listShipping,
  updateShipping,
} = require("../controllers/shipping");

const {
  requireJsonContent,
  parseQueryOptions,
  validateStringIdParam,
  requireEditorOrAdmin,
  asyncHandler,
  validateShippingCreate,
  validateShippingUpdate,
} = require("../core/middleware");

// Public: list shipping prices
router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listShipping(req.queryFilter || {}, req.queryOptions);
    res.json(result);
  }),
);

// Public: get shipping by governorate id
router.get(
  "/:id",
  validateStringIdParam("id"),
  asyncHandler(async (req, res) => {
    const sh = await getShippingById(req.validStringId);
    res.json(sh);
  }),
);

// Admin: create shipping entry
router.post(
  "/",
  requireJsonContent,
  requireEditorOrAdmin,
  validateShippingCreate,
  asyncHandler(async (req, res) => {
    const sh = await createShipping(req.body);
    res.status(201).json(sh);
  }),
);

// Admin: update shipping entry
router.patch(
  "/:id",
  requireJsonContent,
  requireEditorOrAdmin,
  validateStringIdParam("id"),
  validateShippingUpdate,
  asyncHandler(async (req, res) => {
    const sh = await updateShipping(req.validStringId, req.body);
    res.json(sh);
  }),
);

module.exports = router;
