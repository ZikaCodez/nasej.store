const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/products");

const {
  requireJsonContent,
  validateIdParam,
  parseQueryOptions,
  validateProductCreate,
  validateProductUpdate,
  asyncHandler,
} = require("../core/middleware");
// requireAdmin and requireEditorOrAdmin are used for RBAC on product routes
const { requireAdmin, requireEditorOrAdmin } = require("../core/middleware");

router.post(
  "/",
  requireJsonContent,
  validateProductCreate,
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  }),
);

router.get(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const product = await getProductById(req.validId);
    res.json(product);
  }),
);

router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listProducts(
      req.queryFilter || { isActive: true },
      req.queryOptions,
    );
    res.json(result);
  }),
);

router.patch(
  "/:id",
  requireJsonContent,
  validateIdParam("id"),
  requireEditorOrAdmin,
  validateProductUpdate,
  asyncHandler(async (req, res) => {
    const product = await updateProduct(req.validId, req.body);
    res.json(product);
  }),
);

router.delete(
  "/:id",
  validateIdParam("id"),
  requireAdmin,
  asyncHandler(async (req, res) => {
    const result = await deleteProduct(req.validId);
    res.json(result);
  }),
);

module.exports = router;
