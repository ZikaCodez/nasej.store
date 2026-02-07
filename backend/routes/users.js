const express = require("express");
const router = express.Router();

const {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
} = require("../controllers/users");

const {
  requireJsonContent,
  validateIdParam,
  parseQueryOptions,
  validateUserCreate,
  validateUserUpdate,
  asyncHandler,
} = require("../core/middleware");

// Create
router.post(
  "/",
  requireJsonContent,
  validateUserCreate,
  asyncHandler(async (req, res) => {
    const user = await createUser(req.body);
    res.status(201).json(user);
  }),
);

// Read one
router.get(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.validId);
    res.json(user);
  }),
);

// List
router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listUsers({}, req.queryOptions);
    res.json(result);
  }),
);

// Update
router.patch(
  "/:id",
  requireJsonContent,
  validateIdParam("id"),
  validateUserUpdate,
  asyncHandler(async (req, res) => {
    const user = await updateUser(req.validId, req.body);
    res.json(user);
  }),
);

// Delete
router.delete(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const result = await deleteUser(req.validId);
    res.json(result);
  }),
);

module.exports = router;
