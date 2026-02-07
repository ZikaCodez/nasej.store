const { connectDB } = require("../core/db");
const { random6Digit } = require("../core/utility");

function isSixDigitInteger(value) {
  return Number.isInteger(value) && value >= 100000 && value <= 999999;
}

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{11}$/.test(phone);
}

async function generateUnique6DigitId(collectionName) {
  const db = await connectDB();
  const collection = db.collection(collectionName);
  // Try up to 20 times to avoid collision under load
  for (let i = 0; i < 20; i++) {
    const candidate = random6Digit();
    const exists = await collection.findOne(
      { _id: candidate },
      { projection: { _id: 1 } },
    );
    if (!exists) return candidate;
  }
  throw new Error(
    "Failed to generate unique 6-digit ID after multiple attempts",
  );
}

async function ensureId(collectionName, maybeId) {
  if (maybeId === undefined || maybeId === null) {
    return await generateUnique6DigitId(collectionName);
  }
  if (!isSixDigitInteger(maybeId)) {
    throw new Error("_id must be a 6-digit integer");
  }
  return maybeId;
}

module.exports = {
  isSixDigitInteger,
  isValidPhone,
  generateUnique6DigitId,
  ensureId,
};
