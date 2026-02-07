const { connectDB } = require("../core/db");
const { ensureId } = require("./helpers");

// Match seed.js naming (lowercase collection)
const COLLECTION = "categories";

async function createCategory(payload) {
  const db = await connectDB();
  const categories = db.collection(COLLECTION);
  const _id = await ensureId(COLLECTION, payload._id);

  const doc = {
    _id,
    name: payload.name,
    slug: payload.slug,
    parentCategory: payload.parentCategory,
    image: payload.image,
    description: payload.description,
  };
  await categories.insertOne(doc);
  return doc;
}

async function getCategoryById(id) {
  const db = await connectDB();
  const categories = db.collection(COLLECTION);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  const cat = await categories.findOne({ _id: id });
  if (!cat) throw new Error("Category not found");
  return cat;
}

async function listCategories(filter = {}, options = {}) {
  const db = await connectDB();
  const categories = db.collection(COLLECTION);
  const { limit = 50, skip = 0, sort = { name: 1 } } = options;

  const pipeline = [
    { $match: filter },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "categoryProducts",
      },
    },
    {
      $addFields: {
        productCount: { $size: "$categoryProducts" },
      },
    },
    {
      $project: {
        categoryProducts: 0,
      },
    },
  ];

  const items = await categories.aggregate(pipeline).toArray();
  const total = await categories.countDocuments(filter);
  return { items, total };
}

async function updateCategory(id, updates) {
  const db = await connectDB();
  const categories = db.collection(COLLECTION);
  if (!Number.isInteger(id)) throw new Error("id must be integer");
  // Sanitize updates: drop undefined values to avoid driver errors
  const safeUpdates = {};
  for (const [k, v] of Object.entries(updates || {})) {
    if (v !== undefined) safeUpdates[k] = v;
  }

  const result = await categories.updateOne({ _id: id }, { $set: safeUpdates });
  if (!result.matchedCount) throw new Error("Category not found");
  const cat = await categories.findOne({ _id: id });
  if (!cat) throw new Error("Category not found");
  return cat;
}

async function deleteCategory(id, options = {}) {
  const db = await connectDB();
  const categories = db.collection(COLLECTION);
  const products = db.collection("products");

  if (!Number.isInteger(id)) throw new Error("id must be integer");

  const cat = await categories.findOne({ _id: id });
  if (!cat) throw new Error("Category not found");

  const { action, moveToIndex } = options;

  if (action === "delete-products") {
    // Delete all products in this category id
    await products.deleteMany({ category: cat._id });
  } else if (action === "move-products" && moveToIndex) {
    const targetCat = await categories.findOne({ _id: Number(moveToIndex) });
    if (!targetCat) throw new Error("Target category not found");
    await products.updateMany(
      { category: cat._id },
      { $set: { category: targetCat._id } },
    );
  }

  const res = await categories.deleteOne({ _id: id });
  return { deleted: true };
}

module.exports = {
  createCategory,
  getCategoryById,
  listCategories,
  updateCategory,
  deleteCategory,
};
