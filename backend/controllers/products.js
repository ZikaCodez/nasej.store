const { connectDB } = require("../core/db");
const { ensureId } = require("./helpers");

// Match seed.js collection naming (lowercase)
const COLLECTION = "products";

async function createProduct(payload) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  const now = new Date();
  const _id = await ensureId(COLLECTION, payload._id);

  // Validate category
  const categoryNum = Number(payload.category);
  if (!payload.category || isNaN(categoryNum) || categoryNum <= 0) {
    const err = new Error("Product category is required");
    err.statusCode = 400;
    throw err;
  }

  const doc = {
    _id,
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    basePrice: payload.basePrice,
    category: categoryNum,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    variants: Array.isArray(payload.variants)
      ? payload.variants.map((v) => ({
          ...v,
          // Normalize numeric fields
          priceModifier:
            v.priceModifier === undefined || v.priceModifier === null
              ? 0
              : Number(v.priceModifier),
          // Stock defaults to 0 if not provided
          stock:
            v.stock === undefined || v.stock === null
              ? 0
              : Math.max(0, Number(v.stock)),
        }))
      : [],
    isFeatured: !!payload.isFeatured,
    isActive: payload.isActive !== undefined ? !!payload.isActive : true,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  };

  await products.insertOne(doc);
  return doc;
}

/**
 * Adjust the stock of a specific product variant.
 *
 * quantityChange can be positive (restock) or negative (reserve stock).
 * Throws an error if the variant does not exist or if the change would
 * make stock negative.
 */
async function adjustVariantStock(productId, sku, quantityChange) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);

  if (!Number.isInteger(productId))
    throw new Error("productId must be integer");
  if (!sku || typeof sku !== "string") throw new Error("sku is required");
  if (!Number.isInteger(quantityChange)) {
    throw new Error("quantityChange must be an integer");
  }

  const product = await products.findOne({ _id: productId, isActive: true });
  if (!product) {
    const err = new Error("Product not found or inactive");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    throw new Error("Product has no variants configured");
  }

  const variant = product.variants.find((v) => v.sku === sku);
  if (!variant) {
    const err = new Error("Variant not found for product");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  const currentStock =
    typeof variant.stock === "number" && !Number.isNaN(variant.stock)
      ? variant.stock
      : 0;

  const nextStock = currentStock + quantityChange;
  if (nextStock < 0) {
    const err = new Error("Variant is out of stock");
    err.statusCode = 400;
    err.code = "OUT_OF_STOCK";
    throw err;
  }

  await products.updateOne(
    { _id: productId, "variants.sku": sku },
    {
      $set: {
        "variants.$.stock": nextStock,
        updatedAt: new Date(),
      },
    },
  );

  return { productId, sku, stock: nextStock };
}

async function getProductById(id) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  const product = await products.findOne({ _id: id });
  if (!product) throw new Error("Product not found");
  return product;
}

async function listProducts(filter = { isActive: true }, options = {}) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
  // If filtering by category, ensure it's a number
  const filterCopy = { ...filter };
  if (filterCopy.category) {
    filterCopy.category = Number(filterCopy.category);
  }
  const cursor = products.find(filterCopy).sort(sort).skip(skip).limit(limit);
  const items = await cursor.toArray();
  const total = await products.countDocuments(filterCopy);
  return { items, total };
}

async function updateProduct(id, updates) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  if (!Number.isInteger(id)) throw new Error("id must be integer");

  const set = { ...updates, updatedAt: new Date() };

  // Use updateOne then fetch the document to avoid driver-specific findOneAndUpdate
  const result = await products.updateOne({ _id: id }, { $set: set });
  if (result.matchedCount === 0) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }
  const value = await products.findOne({ _id: id });
  return value;
}

// Soft delete: set isActive=false
async function deleteProduct(id) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  const orders = db.collection("orders");

  if (!Number.isInteger(id)) throw new Error("id must be integer");

  // Perform an actual delete. Return 404 if not found.
  const result = await products.deleteOne({ _id: id });
  if (!result || result.deletedCount === 0) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  // Remove this product from all "processing" orders
  // We search for orders with this productId in the items array
  const affectedOrders = await orders
    .find({
      orderStatus: "processing",
      "items.productId": id,
    })
    .toArray();

  for (const order of affectedOrders) {
    const newItems = order.items.filter((it) => it.productId !== id);
    if (newItems.length === 0) {
      // If no items left, we could either delete the order or just leave it empty.
      // Usually, an empty order is bad. Let's delete it if it becomes empty.
      await orders.deleteOne({ _id: order._id });
    } else {
      const subtotal = newItems.reduce(
        (sum, it) => sum + it.priceAtPurchase * it.quantity,
        0,
      );
      const total = subtotal + (order.shippingFee || 0);
      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            items: newItems,
            subtotal,
            total,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  return { deleted: true };
}

module.exports = {
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
  deleteProduct,
  adjustVariantStock,
};
