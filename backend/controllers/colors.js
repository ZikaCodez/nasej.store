const { connectDB } = require("../core/db");

const COLLECTION = "colors";

async function createColor(payload) {
  const db = await connectDB();
  const colors = db.collection(COLLECTION);
  const _id = String(payload._id).trim().toLowerCase();
  const doc = { _id, hex: payload.hex };
  await colors.insertOne(doc);
  return doc;
}

async function getColorById(id) {
  const db = await connectDB();
  const colors = db.collection(COLLECTION);
  const color = await colors.findOne({ _id: id.toLowerCase() });
  if (!color) throw new Error("Color not found");
  return color;
}

async function listColors(filter = {}, options = {}) {
  const db = await connectDB();
  const colors = db.collection(COLLECTION);
  const { limit = 100, skip = 0, sort = { _id: 1 } } = options;
  const cursor = colors.find(filter).sort(sort).skip(skip).limit(limit);
  const items = await cursor.toArray();
  const total = await colors.countDocuments(filter);
  return { items, total };
}

async function updateColor(id, updates) {
  const db = await connectDB();
  const colors = db.collection(COLLECTION);
  const { value } = await colors.findOneAndUpdate(
    { _id: id.toLowerCase() },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!value) throw new Error("Color not found");
  return value;
}

module.exports = {
  createColor,
  getColorById,
  listColors,
  updateColor,
};
