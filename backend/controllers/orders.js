const { connectDB } = require("../core/db");
const { ensureId } = require("./helpers");
const { adjustVariantStock } = require("./products");

const ORDERS = "orders";
const PRODUCTS = "products";
const USERS = "users";

function isDiscountValid(discount) {
  if (!discount || !discount.isActive) return false;
  const now = new Date();
  if (discount.startDate && now < new Date(discount.startDate)) return false;
  if (discount.endDate && now > new Date(discount.endDate)) return false;
  return true;
}

function applyDiscountToPrice(basePrice, discount) {
  if (!discount) return basePrice;
  if (discount.type === "percentage") {
    return Math.max(0, basePrice * (1 - discount.value / 100));
  }
  if (discount.type === "fixed") {
    return Math.max(0, basePrice - discount.value);
  }
  return basePrice;
}

async function createOrder(payload) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  const products = db.collection(PRODUCTS);
  const users = db.collection(USERS);

  const now = new Date();
  const _id = await ensureId(ORDERS, payload._id);

  // Validate user exists
  if (!Number.isInteger(payload.userId))
    throw new Error("userId must be a 6-digit integer");
  const user = await users.findOne({ _id: payload.userId });
  if (!user) throw new Error("User not found for order");

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // Validate products & variants, build enriched items, and reserve stock per-variant
  const enrichedItems = [];
  const stockAdjustments = [];
  for (const item of payload.items) {
    if (!Number.isInteger(item.productId))
      throw new Error("item.productId must be integer");
    const quantity = Number(item.quantity || 1);
    const sku = item.sku;
    if (!sku) throw new Error("Order item requires SKU of the variant");
    if (quantity <= 0) {
      throw new Error("Order item quantity must be positive");
    }

    const product = await products.findOne({
      _id: item.productId,
      isActive: true,
    });
    if (!product) {
      throw new Error(`Product ${item.productId} not found or inactive`);
    }

    const variant =
      product && Array.isArray(product.variants)
        ? product.variants.find((v) => v.sku === item.sku)
        : null;

    if (!variant) {
      const err = new Error("Variant not found for product");
      err.statusCode = 404;
      err.code = 404;
      throw err;
    }

    const basePrice = product ? Number(product.basePrice || 0) : 0;
    const variantModifier = variant ? Number(variant.priceModifier || 0) : 0;
    const originalPrice = basePrice + variantModifier;

    // Prefer variant-level discount if present, otherwise product-level
    const discountSource =
      variant && variant.discount
        ? variant.discount
        : product && product.discount
          ? product.discount
          : null;
    const discountSnapshot = discountSource ? { ...discountSource } : null;
    const discountApplied = isDiscountValid(discountSnapshot);

    const priceAtPurchase = discountApplied
      ? applyDiscountToPrice(originalPrice, discountSnapshot)
      : originalPrice;

    // Reserve stock for this variant. If any item fails (e.g. out of stock),
    // we will roll back previous reservations.
    try {
      await adjustVariantStock(product._id, variant.sku, -quantity);
      stockAdjustments.push({
        productId: product._id,
        sku: variant.sku,
        qty: quantity,
      });
    } catch (err) {
      // Best-effort rollback of any earlier stock reservations
      for (const adj of stockAdjustments) {
        try {
          await adjustVariantStock(adj.productId, adj.sku, adj.qty);
        } catch (_) {
          // swallow rollback errors; original error is more important
        }
      }
      throw err;
    }

    enrichedItems.push({
      productId: Number(item.productId),
      sku: item.sku,
      quantity: Number(item.quantity || 1),
      priceAtPurchase: Number(priceAtPurchase),
      originalPrice: Number(originalPrice),
      discountSnapshot,
      discountApplied: Boolean(discountApplied),
      name: product?.name || item.name || null,
      image:
        (variant && (variant.images?.[0] || variant.imageUrls?.[0])) ||
        product?.thumbnail ||
        null,
    });
  }

  // Compute totals if not provided
  const subtotal =
    payload.subtotal !== undefined
      ? payload.subtotal
      : enrichedItems.reduce(
          (sum, it) => sum + it.priceAtPurchase * it.quantity,
          0,
        );
  const shippingFee =
    payload.shippingFee !== undefined ? payload.shippingFee : 0;
  const discountTotal = payload.discountTotal || 0;
  const total =
    payload.total !== undefined
      ? payload.total
      : subtotal + shippingFee - discountTotal;

  const doc = {
    _id,
    userId: payload.userId,
    items: enrichedItems,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod || "COD",
    paymentStatus: payload.paymentStatus || "pending",
    orderStatus: payload.orderStatus || "processing",
    subtotal,
    shippingFee,
    discountTotal,
    promoCode: payload.promoCode,
    total,
    trackingNumber: payload.trackingNumber,
    placedAt: payload.placedAt || now,
  };

  // If promoCode was used, increment its usage count
  if (payload.promoCode) {
    const promos = db.collection("promos");
    await promos.updateOne(
      { code: payload.promoCode.toUpperCase() },
      { $inc: { usageCount: 1 } },
    );
  }

  await orders.insertOne(doc);
  return doc;
}

async function getOrderById(id) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  const order = await orders.findOne({ _id: id });
  if (!order) throw new Error("Order not found");
  return order;
}

async function listOrders(filter = {}, options = {}) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  const { limit = 50, skip = 0, sort = { placedAt: -1 } } = options;
  const cursor = orders.find(filter).sort(sort).skip(skip).limit(limit);
  const items = await cursor.toArray();
  const total = await orders.countDocuments(filter);
  return { items, total };
}

async function updateOrder(id, updates) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  if (!Number.isInteger(id)) throw new Error("id must be integer");

  // Fetch existing order to handle cancellation rollback
  const existing = await orders.findOne({ _id: id });
  if (!existing) throw new Error("Order not found");

  // Restrict updatable fields
  const allowed = [
    "paymentStatus",
    "orderStatus",
    "trackingNumber",
    "items",
    "shippingAddress",
  ];
  const set = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) set[key] = updates[key];
  }

  // If items are updated, recalculate totals
  if (set.items) {
    // Ensure items contain snapshot fields; if not, attempt to preserve from existing or compute
    const products = db.collection(PRODUCTS);
    const enriched = [];
    for (const it of set.items) {
      // Try to preserve existing snapshot
      const matching = (existing.items || []).find(
        (e) => e.productId === it.productId && e.sku === it.sku,
      );
      if (matching && matching.originalPrice !== undefined) {
        enriched.push({ ...matching, ...it });
        continue;
      }
      // Fetch product to build snapshot
      const product = await products.findOne({ _id: it.productId });
      const variant =
        product && Array.isArray(product.variants)
          ? product.variants.find((v) => v.sku === it.sku)
          : null;
      const basePrice = product ? Number(product.basePrice || 0) : 0;
      const variantModifier = variant ? Number(variant.priceModifier || 0) : 0;
      const originalPrice = basePrice + variantModifier;
      const discountSource =
        variant && variant.discount
          ? variant.discount
          : product && product.discount
            ? product.discount
            : null;
      const discountSnapshot = discountSource ? { ...discountSource } : null;
      const discountApplied = isDiscountValid(discountSnapshot);
      const priceAtPurchase = discountApplied
        ? applyDiscountToPrice(originalPrice, discountSnapshot)
        : originalPrice;
      enriched.push({
        productId: Number(it.productId),
        sku: it.sku,
        quantity: Number(it.quantity || 1),
        priceAtPurchase: Number(it.priceAtPurchase ?? priceAtPurchase),
        originalPrice: Number(originalPrice),
        discountSnapshot,
        discountApplied: Boolean(discountApplied),
        name: product?.name || it.name || null,
        image:
          (variant && (variant.images?.[0] || variant.imageUrls?.[0])) ||
          product?.thumbnail ||
          null,
      });
    }
    set.items = enriched;
    const subtotal = set.items.reduce(
      (sum, it) => sum + it.priceAtPurchase * it.quantity,
      0,
    );
    set.subtotal = subtotal;
    set.total = subtotal + (existing.shippingFee || 0);
  }

  // Made-to-order: no inventory to restore on cancellation
  // If there is nothing to update, return the existing document
  if (Object.keys(set).length === 0) return existing;

  set.updatedAt = new Date();

  // Use updateOne + findOne for compatibility across driver versions
  await orders.updateOne({ _id: id }, { $set: set });
  const updated = await orders.findOne({ _id: id });
  if (!updated) throw new Error("Order not found");
  return updated;
}

// Customer-side updates: allow editing items and shipping address
// only while the order is still in "processing" status.
async function updateOrderForCustomer(id, userId, updates) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  if (!Number.isInteger(userId)) throw new Error("userId must be integer");

  const existing = await orders.findOne({ _id: id, userId });
  if (!existing) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  // Customers can request return or cancel return request
  if (
    updates.orderStatus === "return-request" ||
    (existing.orderStatus === "return-request" &&
      updates.orderStatus === "delivered")
  ) {
    if (
      existing.orderStatus !== "delivered" &&
      existing.orderStatus !== "return-request"
    ) {
      throw new Error("Return can only be requested for delivered orders");
    }
    const refDate = existing.updatedAt || existing.placedAt;
    const diff = (new Date() - new Date(refDate)) / (1000 * 60 * 60 * 24);
    if (diff > 2 && updates.orderStatus === "return-request") {
      throw new Error("Return request period (2 days) has expired");
    }

    const updatedAt = new Date();
    await orders.updateOne(
      { _id: id, userId },
      { $set: { orderStatus: updates.orderStatus, updatedAt } },
    );
    return { ...existing, orderStatus: updates.orderStatus, updatedAt };
  }

  if (existing.orderStatus !== "processing") {
    const err = new Error("Order can only be edited while processing");
    err.statusCode = 400;
    err.code = 400;
    throw err;
  }

  const set = { updatedAt: new Date() };
  let items = existing.items || [];

  if (Array.isArray(updates.items) && updates.items.length > 0) {
    // Validate and enrich incoming items; preserve existing snapshots where possible
    const products = db.collection(PRODUCTS);
    const enriched = [];
    for (const it of updates.items) {
      if (!Number.isInteger(it.productId)) {
        throw new Error("Order item productId must be an integer");
      }
      if (!it.sku || typeof it.sku !== "string") {
        throw new Error("Order item sku is required");
      }
      if (typeof it.quantity !== "number" || it.quantity <= 0) {
        throw new Error(
          "Order item quantity must be a positive number for updates",
        );
      }

      // Try to reuse existing snapshot
      const matching = (existing.items || []).find(
        (e) => e.productId === it.productId && e.sku === it.sku,
      );
      if (matching && matching.originalPrice !== undefined) {
        // merge fields, but allow priceAtPurchase override
        enriched.push({ ...matching, ...it });
        continue;
      }

      // Build snapshot from product data
      const product = await products.findOne({ _id: it.productId });
      const variant =
        product && Array.isArray(product.variants)
          ? product.variants.find((v) => v.sku === it.sku)
          : null;
      const basePrice = product ? Number(product.basePrice || 0) : 0;
      const variantModifier = variant ? Number(variant.priceModifier || 0) : 0;
      const originalPrice = basePrice + variantModifier;
      const discountSource =
        variant && variant.discount
          ? variant.discount
          : product && product.discount
            ? product.discount
            : null;
      const discountSnapshot = discountSource ? { ...discountSource } : null;
      const discountApplied = isDiscountValid(discountSnapshot);
      const priceAtPurchase = discountApplied
        ? applyDiscountToPrice(originalPrice, discountSnapshot)
        : originalPrice;

      enriched.push({
        productId: Number(it.productId),
        sku: it.sku,
        quantity: Number(it.quantity || 1),
        priceAtPurchase: Number(it.priceAtPurchase ?? priceAtPurchase),
        originalPrice: Number(originalPrice),
        discountSnapshot,
        discountApplied: Boolean(discountApplied),
        name: product?.name || it.name || null,
        image:
          (variant && (variant.images?.[0] || variant.imageUrls?.[0])) ||
          product?.thumbnail ||
          null,
      });
    }
    items = enriched;
    set.items = items;
  }

  if (updates.shippingAddress && typeof updates.shippingAddress === "object") {
    set.shippingAddress = updates.shippingAddress;
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const subtotal = items.reduce(
    (sum, it) => sum + it.priceAtPurchase * it.quantity,
    0,
  );
  const shippingFee = existing.shippingFee || 0;
  const total = subtotal + shippingFee;

  set.subtotal = subtotal;
  set.total = total;

  await orders.updateOne({ _id: id, userId }, { $set: set });
  return { ...existing, ...set };
}

// Customer-side cancellation: allow cancelling only while processing.
async function cancelOrderForCustomer(id, userId) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  if (!Number.isInteger(userId)) throw new Error("userId must be integer");

  const existing = await orders.findOne({ _id: id, userId });
  if (!existing) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  if (existing.orderStatus !== "processing") {
    const err = new Error(
      "Only processing orders can be cancelled by customer",
    );
    err.statusCode = 400;
    err.code = 400;
    throw err;
  }
  const updatedAt = new Date();
  await orders.updateOne(
    { _id: id, userId },
    { $set: { orderStatus: "cancelled", updatedAt } },
  );
  return { ...existing, orderStatus: "cancelled", updatedAt };
}

async function deleteOrder(id) {
  const db = await connectDB();
  const orders = db.collection(ORDERS);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  const res = await orders.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw new Error("Order not found");
  return { deleted: true };
}

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  updateOrder,
  updateOrderForCustomer,
  cancelOrderForCustomer,
  deleteOrder,
};
