const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderById,
  listOrders,
  updateOrder,
  updateOrderForCustomer,
  cancelOrderForCustomer,
  deleteOrder,
} = require("../controllers/orders");

const {
  requireJsonContent,
  validateIdParam,
  parseQueryOptions,
  validateOrderCreate,
  validateOrderUpdate,
  asyncHandler,
  requireAuth,
  requireAdmin,
  requirePhone,
} = require("../core/middleware");

router.post(
  "/",
  requireAuth,
  requirePhone,
  requireJsonContent,
  validateOrderCreate,
  asyncHandler(async (req, res) => {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  }),
);

router.get(
  "/:id",
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const order = await getOrderById(req.validId);
    res.json(order);
  }),
);

router.get(
  "/",
  parseQueryOptions,
  asyncHandler(async (req, res) => {
    const result = await listOrders(req.queryFilter || {}, req.queryOptions);
    res.json(result);
  }),
);

// Customer can edit their own processing orders (items, shipping address)
router.patch(
  "/:id/customer",
  requireAuth,
  requireJsonContent,
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const order = await updateOrderForCustomer(
      req.validId,
      req.user._id,
      req.body,
    );
    res.json(order);
  }),
);

// Customer can cancel their own processing orders
router.post(
  "/:id/customer/cancel",
  requireAuth,
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const order = await cancelOrderForCustomer(req.validId, req.user._id);
    res.json(order);
  }),
);

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  requireJsonContent,
  validateIdParam("id"),
  validateOrderUpdate,
  asyncHandler(async (req, res) => {
    const order = await updateOrder(req.validId, req.body);
    res.json(order);
  }),
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validateIdParam("id"),
  asyncHandler(async (req, res) => {
    const result = await deleteOrder(req.validId);
    res.json(result);
  }),
);

module.exports = router;
