const express = require("express");
const users = require("./users");
const categories = require("./categories");
const products = require("./products");
const colors = require("./colors");
const orders = require("./orders");
const image = require("./image");
const offers = require("./offers");
const shipping = require("./shipping");

const router = express.Router();

router.use("/users", users);
router.use("/categories", categories);
router.use("/products", products);
router.use("/orders", orders);
router.use("/colors", colors);
router.use("/image", image);
router.use("/shipping", shipping);
router.use("/", offers);

module.exports = router;
