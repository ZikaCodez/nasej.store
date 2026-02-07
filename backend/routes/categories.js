const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories");

const {
  requireJsonContent,
  validateIdParam,
  parseQueryOptions,
  validateCategoryCreate,
  validateCategoryUpdate,
  asyncHandler,
} = require("../core/middleware");

router.post(
  "/",
  requireJsonContent,
  validateCategoryCreate,
  asyncHandler(async (req, res) => {
    const cat = await createCategory(req.body);
    res.status(201).json(cat);
  }),
);

router.get(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const cat = await getCategoryById(req.validId);
    res.json(cat);
  }),
);

router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listCategories({}, req.queryOptions);
    res.json(result);
  }),
);

router.patch(
  "/:id",
  requireJsonContent,
  validateIdParam("id"),
  validateCategoryUpdate,
  asyncHandler(async (req, res) => {
    const cat = await updateCategory(req.validId, req.body);
    res.json(cat);
  }),
);

router.delete(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const result = await deleteCategory(req.validId, req.query);
    res.json(result);
  }),
);

module.exports = router;
