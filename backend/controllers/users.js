const { connectDB } = require("../core/db");
const { ensureId, isValidPhone } = require("./helpers");

const COLLECTION = "users";

async function createUser(payload) {
  const db = await connectDB();
  const users = db.collection(COLLECTION);

  const now = new Date();
  const _id = await ensureId(COLLECTION, payload._id);

  if (!isValidPhone(payload.phone)) {
    throw new Error("User phone must be an 11-digit string");
  }

  const doc = {
    _id,
    name: payload.name,
    email: payload.email,
    password: payload.password, // assume hashed upstream, optional
    phone: payload.phone,
    role: payload.role || "customer",
    addresses: Array.isArray(payload.addresses) ? payload.addresses : [],
    wishlist: Array.isArray(payload.wishlist) ? payload.wishlist : [],
    cartItems: Array.isArray(payload.cartItems) ? payload.cartItems : [],
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
    isActive: payload.isActive !== undefined ? !!payload.isActive : true,
  };

  await users.insertOne(doc);
  return doc;
}

async function getUserById(id) {
  const db = await connectDB();
  const users = db.collection(COLLECTION);
  // Only accept numeric _id (number) or numeric string that can be coerced to number
  let idNum = null;
  if (Number.isInteger(id)) {
    idNum = id;
  } else if (typeof id === "string" && /^\d+$/.test(id)) {
    idNum = Number(id);
  } else {
    const err = new Error("id must be a 6-digit integer");
    err.statusCode = 400;
    throw err;
  }

  const user = await users.findOne({ _id: idNum });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }
  return user;
}

async function listUsers(filter = { isActive: true }, options = {}) {
  const db = await connectDB();
  const users = db.collection(COLLECTION);
  const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
  const cursor = users.find(filter).sort(sort).skip(skip).limit(limit);
  const items = await cursor.toArray();
  const total = await users.countDocuments(filter);
  return { items, total };
}

async function updateUser(id, updates) {
  const db = await connectDB();
  const users = db.collection(COLLECTION);
  if (!Number.isInteger(id)) throw new Error("id must be integer");

  if (updates.phone !== undefined && !isValidPhone(updates.phone)) {
    throw new Error("User phone must be an 11-digit string");
  }
  // Use updateOne for driver compatibility, then fetch the updated document
  const result = await users.updateOne(
    { _id: id },
    { $set: { ...updates, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }
  const user = await users.findOne({ _id: id });
  return user;
}

// Hard delete: completely remove user and cleanup orders
async function deleteUser(id) {
  const db = await connectDB();
  const users = db.collection(COLLECTION);
  const orders = db.collection("orders");

  if (!Number.isInteger(id)) throw new Error("id must be integer");

  // Fetch all user's orders first
  try {
    const userOrders = await orders.find({ userId: id }).toArray();

    // Map orders to delete: keep only delivered AND paid orders
    const orderIdsToDelete = userOrders
      .filter(
        (order) =>
          !(
            order.orderStatus === "delivered" && order.paymentStatus === "paid"
          ),
      )
      .map((order) => order._id);

    // Delete the mapped orders
    if (orderIdsToDelete.length > 0) {
      await orders.deleteMany({
        _id: { $in: orderIdsToDelete },
      });
    }
  } catch (orderDeleteError) {
    // Log the error but don't fail the entire deletion
    console.error("Error deleting user orders:", orderDeleteError);
  }

  // Hard delete the user from database
  const result = await users.deleteOne({ _id: id });

  if (result.deletedCount === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    err.code = 404;
    throw err;
  }

  return { deleted: true };
}

module.exports = {
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
};
