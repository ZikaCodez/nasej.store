const { connectDB } = require("../core/db");

const COLLECTION = "shipping";

async function createShipping(payload) {
  const db = await connectDB();
  const shipping = db.collection(COLLECTION);
  const _id = String(payload._id).trim(); // governorate id string
  const doc = {
    _id,
    label: payload.label ? String(payload.label).trim() : undefined,
    price: Number(payload.price),
    currency: payload.currency ? String(payload.currency) : "EGP",
    updatedAt: new Date(),
  };
  await shipping.insertOne(doc);
  return doc;
}

async function getShippingById(id) {
  const db = await connectDB();
  const shipping = db.collection(COLLECTION);
  const res = await shipping.findOne({ _id: String(id).trim() });
  if (!res) throw new Error("Shipping entry not found");
  return res;
}

async function listShipping(filter = {}, options = {}) {
  const db = await connectDB();
  const shipping = db.collection(COLLECTION);
  const { limit = 100, skip = 0, sort = { _id: 1 } } = options;
  const cursor = shipping.find(filter).sort(sort).skip(skip).limit(limit);
  const items = await cursor.toArray();
  const total = await shipping.countDocuments(filter);
  return { items, total };
}

async function updateShipping(id, updates) {
  const db = await connectDB();
  const shipping = db.collection(COLLECTION);
  const set = { ...updates, updatedAt: new Date() };
  const { value } = await shipping.findOneAndUpdate(
    { _id: String(id).trim() },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!value) throw new Error("Shipping entry not found");
  return value;
}

module.exports = {
  createShipping,
  getShippingById,
  listShipping,
  updateShipping,
};
