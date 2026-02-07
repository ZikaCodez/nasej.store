const { connectDB } = require("../core/db");
const { ensureId } = require("./helpers");

// Match seed.js collection naming (lowercase)
const COLLECTION = "products";

async function createProduct(payload) {
  const db = await connectDB();
  const products = db.collection(COLLECTION);
  const now = new Date();
  const _id = await ensureId(COLLECTION, payload._id);

  const doc = {
    _id,
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    basePrice: payload.basePrice,
    category: Number(payload.category), // Ensure category is stored as number
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    variants: Array.isArray(payload.variants) ? payload.variants : [],
    isFeatured: !!payload.isFeatured,
    isActive: payload.isActive !== undefined ? !!payload.isActive : true,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
  };

  await products.insertOne(doc);
  return doc;
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
};
