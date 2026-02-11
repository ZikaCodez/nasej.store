// Shared validation and utility middleware for the e-commerce backend template.
// Follows project rules: 6-digit integer IDs and 11-digit phone for users.

function isSixDigitInteger(value) {
  return Number.isInteger(value) && value >= 100000 && value <= 999999;
}

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{11}$/.test(phone);
}

// Ensure Content-Type application/json for write operations
function requireJsonContent(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (!ct.includes("application/json")) {
    return res
      .status(415)
      .json({ error: "Content-Type must be application/json" });
  }
  next();
}

// Validate :id route param as 6-digit integer
function validateIdParam(paramName = "id") {
  return function (req, res, next) {
    const raw = req.params[paramName];
    const id = parseInt(raw, 10);
    if (!isSixDigitInteger(id)) {
      return res
        .status(400)
        .json({ error: `${paramName} must be a 6-digit integer` });
    }
    // Attach parsed id for downstream use
    req.validId = id;
    next();
  };
}

// Parse pagination/sort/filter query params into normalized objects
function parseQueryOptions(req, res, next) {
  const { limit, skip, sort, filter } = req.query;
  const options = {};
  if (limit !== undefined) options.limit = parseInt(limit, 10);
  if (skip !== undefined) options.skip = parseInt(skip, 10);
  if (sort) {
    try {
      options.sort = JSON.parse(sort);
    } catch (e) {
      return res.status(400).json({ error: "Invalid sort JSON" });
    }
  }
  let parsedFilter = undefined;
  if (filter) {
    try {
      parsedFilter = JSON.parse(filter);
    } catch (e) {
      return res.status(400).json({ error: "Invalid filter JSON" });
    }
  }
  req.queryOptions = options;
  req.queryFilter = parsedFilter;
  next();
}

// User payload validators
function validateUserCreate(req, res, next) {
  const b = req.body || {};
  if (!b.name || typeof b.name !== "string") {
    return res.status(400).json({ error: "User name is required" });
  }
  if (!b.email || typeof b.email !== "string") {
    return res.status(400).json({ error: "User email is required" });
  }
  if (!isValidPhone(b.phone)) {
    return res
      .status(400)
      .json({ error: "User phone must be an 11-digit string" });
  }
  if (b.role && !["customer", "admin", "editor"].includes(b.role)) {
    return res.status(400).json({ error: "Invalid user role" });
  }
  next();
}

function validateUserUpdate(req, res, next) {
  const b = req.body || {};
  if (b.phone !== undefined && !isValidPhone(b.phone)) {
    return res
      .status(400)
      .json({ error: "User phone must be an 11-digit string" });
  }
  if (
    b.role !== undefined &&
    !["customer", "admin", "editor"].includes(b.role)
  ) {
    return res.status(400).json({ error: "Invalid user role" });
  }
  next();
}

// Category payload validators
function validateCategoryCreate(req, res, next) {
  const b = req.body || {};
  if (!b.name || typeof b.name !== "string") {
    return res.status(400).json({ error: "Category name is required" });
  }
  if (!b.slug || typeof b.slug !== "string") {
    return res.status(400).json({ error: "Category slug is required" });
  }
  next();
}

function validateCategoryUpdate(_req, _res, next) {
  next();
}

// Product payload validators
function validateProductCreate(req, res, next) {
  const b = req.body || {};
  console.log(b)
  if (!b.name || typeof b.name !== "string") {
    return res.status(400).json({ error: "Product name is required" });
  }
  if (!b.slug || typeof b.slug !== "string") {
    return res.status(400).json({ error: "Product slug is required" });
  }
  if (typeof b.basePrice !== "number") {
    return res
      .status(400)
      .json({ error: "Product basePrice must be a number" });
  }
  if (!b.category || typeof b.category !== "number") {
    return res.status(400).json({ error: "Product category is required" });
  }
  if (b.variants !== undefined) {
    if (!Array.isArray(b.variants)) {
      return res
        .status(400)
        .json({ error: "Product variants must be an array" });
    }
    for (const v of b.variants) {
      if (!v || typeof v !== "object") {
        return res
          .status(400)
          .json({ error: "Each variant must be an object" });
      }
      if (!v.sku || typeof v.sku !== "string") {
        return res.status(400).json({ error: "Variant sku is required" });
      }
      // Stock is no longer tracked on variants; production is made-to-order
    }
  }
  next();
}

function validateProductUpdate(_req, _res, next) {
  next();
}

// Order payload validators (basic shape checks)
function validateOrderCreate(req, res, next) {
  const b = req.body || {};
  const userId = b.userId;
  if (!isSixDigitInteger(Number(userId))) {
    return res
      .status(400)
      .json({ error: "Order userId must be a 6-digit integer" });
  }
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return res
      .status(400)
      .json({ error: "Order items must be a non-empty array" });
  }
  for (const it of b.items) {
    if (!isSixDigitInteger(Number(it.productId))) {
      return res
        .status(400)
        .json({ error: "Order item productId must be a 6-digit integer" });
    }
    if (!it.sku || typeof it.sku !== "string") {
      return res.status(400).json({ error: "Order item sku is required" });
    }
    if (typeof it.quantity !== "number" || it.quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Order item quantity must be a positive number" });
    }
    if (typeof it.priceAtPurchase !== "number") {
      return res
        .status(400)
        .json({ error: "Order item priceAtPurchase must be a number" });
    }
  }
  next();
}

function validateOrderUpdate(req, res, next) {
  const b = req.body || {};
  const allowedPayment = ["pending", "paid", "failed"];
  const allowedOrder = [
    "processing",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "return-request",
    "returned",
  ];
  if (
    b.paymentStatus !== undefined &&
    !allowedPayment.includes(b.paymentStatus)
  ) {
    return res.status(400).json({ error: "Invalid paymentStatus" });
  }
  if (b.orderStatus !== undefined && !allowedOrder.includes(b.orderStatus)) {
    return res.status(400).json({ error: "Invalid orderStatus" });
  }
  next();
}

// Async handler utility to avoid try/catch in routes
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Basic not-found and error handlers (optional to use in app.js)
function notFoundHandler(_req, res, _next) {
  res.status(404).json({ code: 404, message: "Not found" });
}

function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const code = err.code || status;
  const message = err.message || "Internal Server Error";
  const details = err.details;
  const payload = details ? { code, message, details } : { code, message };
  res.status(status).json(payload);
}

// Auth guards
function requireAuth(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ code: 401, message: "Authentication required" });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ code: 401, message: "Authentication required" });
  if (req.user.role !== "admin")
    return res.status(403).json({ code: 403, message: "Admin only" });
  next();
}

function requireEditorOrAdmin(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ code: 401, message: "Authentication required" });
  if (req.user.role === "admin" || req.user.role === "editor") return next();
  return res.status(403).json({ code: 403, message: "Editor or Admin only" });
}

// Require phone presence for checkout flows
function requirePhone(req, res, next) {
  if (!req.user)
    return res
      .status(401)
      .json({ code: 401, message: "Authentication required" });
  if (!req.user.phone)
    return res
      .status(403)
      .json({ code: "MISSING_PHONE", message: "Phone number required" });
  next();
}

// Validate string id param (lowercase letters/numbers/hyphen)
function validateStringIdParam(paramName = "id") {
  return function (req, res, next) {
    const raw = req.params[paramName] || "";
    const id = String(raw).trim().toLowerCase();
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      return res
        .status(400)
        .json({ error: `${paramName} must be a lowercase string id` });
    }
    req.validStringId = id;
    next();
  };
}

// Color validators
function validateColorCreate(req, res, next) {
  const b = req.body || {};
  if (!b._id || typeof b._id !== "string") {
    return res
      .status(400)
      .json({ error: "Color _id is required (lowercase name)" });
  }
  if (
    !b.hex ||
    typeof b.hex !== "string" ||
    !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(b.hex)
  ) {
    return res
      .status(400)
      .json({ error: "Color hex must be a valid hex code" });
  }
  req.body._id = b._id.toLowerCase();
  next();
}

function validateColorUpdate(req, res, next) {
  const b = req.body || {};
  if (b.hex !== undefined) {
    if (
      typeof b.hex !== "string" ||
      !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(b.hex)
    ) {
      return res
        .status(400)
        .json({ error: "Color hex must be a valid hex code" });
    }
  }
  next();
}

module.exports = {
  // primitives
  isSixDigitInteger,
  isValidPhone,

  // content type
  requireJsonContent,

  // route/query helpers
  validateIdParam,
  parseQueryOptions,
  asyncHandler,

  // resource validators
  validateUserCreate,
  validateUserUpdate,
  validateCategoryCreate,
  validateCategoryUpdate,
  validateProductCreate,
  validateProductUpdate,
  validateOrderCreate,
  validateOrderUpdate,

  // terminal handlers
  notFoundHandler,
  errorHandler,
  requireAuth,
  requireAdmin,
  requireEditorOrAdmin,
  validateStringIdParam,
  validateColorCreate,
  validateColorUpdate,
  requirePhone,
  // shipping validators
  validateShippingCreate(req, res, next) {
    const b = req.body || {};
    if (!b._id || typeof b._id !== "string") {
      return res
        .status(400)
        .json({ error: "Shipping _id is required (governorate id string)" });
    }
    if (b.price === undefined || typeof b.price !== "number" || b.price < 0) {
      return res
        .status(400)
        .json({ error: "Shipping price must be a non-negative number" });
    }
    if (b.currency !== undefined && typeof b.currency !== "string") {
      return res.status(400).json({ error: "currency must be a string" });
    }
    next();
  },
  validateShippingUpdate(req, res, next) {
    const b = req.body || {};
    if (b.price !== undefined) {
      if (typeof b.price !== "number" || b.price < 0) {
        return res
          .status(400)
          .json({ error: "Shipping price must be a non-negative number" });
      }
    }
    if (b.currency !== undefined && typeof b.currency !== "string") {
      return res.status(400).json({ error: "currency must be a string" });
    }
    if (b.label !== undefined && typeof b.label !== "string") {
      return res.status(400).json({ error: "label must be a string" });
    }
    next();
  },
};
