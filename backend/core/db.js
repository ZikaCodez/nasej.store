const { MongoClient } = require("mongodb");
require("dotenv").config();
let db;

async function connectDB() {
  if (db) return db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db("MainDB");
  return db;
}

module.exports = { connectDB };
