const express = require("express");
const router = express.Router();
const offersController = require("../controllers/offers");
const { requireEditorOrAdmin } = require("../core/middleware");

router.get("/promos", requireEditorOrAdmin, async (req, res, next) => {
  try {
    const items = await offersController.listPromos();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/promos", requireEditorOrAdmin, async (req, res, next) => {
  try {
    const promo = await offersController.createPromo(req.body);
    res.status(201).json(promo);
  } catch (err) {
    next(err);
  }
});

router.delete("/promos/:id", requireEditorOrAdmin, async (req, res, next) => {
  try {
    const result = await offersController.deletePromo(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Public route to validate a code (used at checkout)
router.get("/promos/validate/:code", async (req, res, next) => {
  try {
    // Use current authorized user for oncePerCustomer validation
    const userId = req.user && req.user._id ? req.user._id : undefined;
    const promo = await offersController.getPromoByCode(
      req.params.code,
      userId,
    );
    if (!promo || promo.error) {
      return res
        .status(400)
        .json({ message: promo?.error || "Invalid or expired promo code" });
    }
    res.json(promo);
  } catch (err) {
    next(err);
  }
});

router.post("/discounts", requireEditorOrAdmin, async (req, res, next) => {
  try {
    const result = await offersController.applyDiscount(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get all active discounts (categories, products, variants)
router.get("/discounts", requireEditorOrAdmin, async (req, res, next) => {
  try {
    const discounts = await offersController.getAllDiscounts();
    res.json(discounts);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
