const { connectDB } = require("../core/db");
const { ensureId } = require("./helpers");

async function listPromos() {
  const db = await connectDB();
  const promos = db.collection("promos");
  return await promos.find({}).toArray();
}

async function createPromo(data) {
  const db = await connectDB();
  const promos = db.collection("promos");

  const code = data.code.toUpperCase();
  const existing = await promos.findOne({ code });
  if (existing) throw new Error("Promo code already exists");

  const promo = {
    _id: await ensureId("promos", data._id),
    code,
    type: data.type || "percentage",
    value: Number(data.value) || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount) : null,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
    usageCount: 0,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    createdAt: new Date(),
  };

  await promos.insertOne(promo);
  return promo;
}

async function updatePromo(id, updates) {
  const db = await connectDB();
  const promos = db.collection("promos");

  const formattedUpdates = { ...updates, updatedAt: new Date() };
  if (updates.code) formattedUpdates.code = updates.code.toUpperCase();
  if (updates.startDate)
    formattedUpdates.startDate = new Date(updates.startDate);
  if (updates.endDate) formattedUpdates.endDate = new Date(updates.endDate);

  const { value } = await promos.findOneAndUpdate(
    { _id: Number(id) },
    { $set: formattedUpdates },
    { returnDocument: "after" },
  );
  if (!value) throw new Error("Promo code not found");
  return value;
}

async function getPromoByCode(code) {
  const db = await connectDB();
  const promos = db.collection("promos");
  const promo = await promos.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!promo) return null;

  // Check dates
  const now = new Date();
  if (promo.startDate && now < new Date(promo.startDate)) return null;
  if (promo.endDate && now > new Date(promo.endDate)) return null;

  // Check usage limit
  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) return null;

  return promo;
}

async function deletePromo(id) {
  const db = await connectDB();
  const promos = db.collection("promos");
  await promos.deleteOne({ _id: Number(id) });
  return { success: true };
}

async function applyDiscount(data) {
  const db = await connectDB();
  const { scope, discount, targetId, variantSkus } = data;

  if (scope === "category") {
    // When applying discount to a category, apply it to all products in that category
    const products = db.collection("products");
    const result = await products.updateMany(
      { categoryId: Number(targetId) },
      { $set: { discount } },
    );
    return {
      success: true,
      message: `Discount applied to ${result.modifiedCount} product(s) in this category`,
    };
  }

  if (scope === "product") {
    const products = db.collection("products");

    if (variantSkus && variantSkus.length > 0) {
      // Apply to specific variants
      await products.updateOne(
        { _id: Number(targetId) },
        {
          $set: {
            "variants.$[elem].discount": discount,
          },
        },
        {
          arrayFilters: [{ "elem.sku": { $in: variantSkus } }],
        },
      );
    } else {
      // Apply to whole product
      await products.updateOne(
        { _id: Number(targetId) },
        { $set: { discount } },
      );
    }
    return { success: true };
  }

  throw new Error("Invalid discount scope");
}

/**
 * Calculate discounted price based on discount object
 * @param {number} basePrice - Original price
 * @param {Object} discount - Discount object with type and value
 * @returns {number} Discounted price
 */
function calculateDiscountedPrice(basePrice, discount) {
  if (!discount || !discount.isActive) return basePrice;

  const now = new Date();
  if (discount.startDate && now < new Date(discount.startDate))
    return basePrice;
  if (discount.endDate && now > new Date(discount.endDate)) return basePrice;

  if (discount.type === "percentage") {
    return Math.max(0, basePrice * (1 - discount.value / 100));
  } else if (discount.type === "fixed") {
    return Math.max(0, basePrice - discount.value);
  }
  return basePrice;
}

/**
 * Get all active discounts from products and variants
 * Returns structured discount info with calculated prices
 */
async function getAllDiscounts() {
  const db = await connectDB();
  const now = new Date();

  const products = db.collection("products");

  const result = {
    productDiscounts: [],
    variantDiscounts: [],
  };

  // Get product and variant discounts
  const productDocs = await products.find({}).toArray();

  productDocs.forEach((product) => {
    // Product-level discount
    if (product.discount && product.discount.isActive) {
      const isValid =
        (!product.discount.startDate ||
          now >= new Date(product.discount.startDate)) &&
        (!product.discount.endDate ||
          now <= new Date(product.discount.endDate));

      if (isValid) {
        const discountedPrice = calculateDiscountedPrice(
          product.basePrice,
          product.discount,
        );
        result.productDiscounts.push({
          scope: "product",
          productId: product._id,
          productName: product.name,
          basePrice: product.basePrice,
          discountedPrice: discountedPrice,
          discount: product.discount,
          isValid: true,
        });
      }
    }

    // Variant-level discounts
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant) => {
        if (variant.discount && variant.discount.isActive) {
          const isValid =
            (!variant.discount.startDate ||
              now >= new Date(variant.discount.startDate)) &&
            (!variant.discount.endDate ||
              now <= new Date(variant.discount.endDate));

          if (isValid) {
            const variantBasePrice =
              product.basePrice + (variant.priceModifier || 0);
            const discountedPrice = calculateDiscountedPrice(
              variantBasePrice,
              variant.discount,
            );

            result.variantDiscounts.push({
              scope: "variant",
              productId: product._id,
              productName: product.name,
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              basePrice: variantBasePrice,
              discountedPrice: discountedPrice,
              discount: variant.discount,
              isValid: true,
            });
          }
        }
      });
    }
  });

  return result;
}

module.exports = {
  listPromos,
  createPromo,
  updatePromo,
  getPromoByCode,
  deletePromo,
  applyDiscount,
  getAllDiscounts,
  calculateDiscountedPrice,
};
