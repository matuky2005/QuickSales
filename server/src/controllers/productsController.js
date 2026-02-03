import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import { buildContainsMatch, buildExactMatch, normalizeText } from "../utils/normalize.js";

const buildDuplicateQuery = ({ descripcion, marca, atributos }) => {
  const base = {
    descripcion: buildExactMatch(descripcion),
    marca: buildExactMatch(marca)
  };
  if (!atributos.length) {
    return { ...base, atributos: { $size: 0 } };
  }
  return {
    ...base,
    atributos: {
      $all: atributos,
      $size: atributos.length
    }
  };
};

export const createOrGetProduct = async (req, res, next) => {
  try {
    const descripcion = normalizeText(req.body.descripcion);
    const precioSugerido = Number(req.body.precioSugerido ?? 0);
    const marca = normalizeText(req.body.marca || "");
    const monedaInput = normalizeText(req.body.moneda || "ARS").toUpperCase();
    const moneda = monedaInput === "USD" ? "USD" : "ARS";
    const atributos = Array.isArray(req.body.atributos)
      ? req.body.atributos.map((item) => normalizeText(item)).filter(Boolean)
      : [];

    if (!descripcion) {
      return res.status(400).json({ message: "descripcion is required" });
    }

    const duplicate = await Product.findOne(buildDuplicateQuery({ descripcion, marca, atributos }));
    if (duplicate) {
      return res.status(409).json({ message: "product already exists" });
    }

    const product = await Product.create({
      descripcion,
      marca,
      atributos,
      precioSugerido: Math.max(precioSugerido, 0),
      moneda,
      active: true
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const query = normalizeText(req.query.query || "");
    const brand = normalizeText(req.query.brand || "");
    const filter = {};
    if (query) {
      const tokens = query.split(/\s+/).map((token) => token.trim()).filter(Boolean);
      if (tokens.length) {
        filter.$and = tokens.map((token) => ({
          $or: [
            { descripcion: buildContainsMatch(token) },
            { marca: buildContainsMatch(token) },
            { atributos: buildContainsMatch(token) }
          ]
        }));
      }
    }
    if (brand) {
      filter.marca = buildContainsMatch(brand);
    }
    if (req.query.includeInactive !== "true") {
      filter.active = { $ne: false };
    }
    const limit = query ? 10 : 200;
    const products = await Product.find(filter)
      .sort({ descripcion: 1 })
      .limit(limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const descripcion = normalizeText(req.body.descripcion || "");
    const marca = normalizeText(req.body.marca || "");
    const monedaInput = normalizeText(req.body.moneda || "");
    const moneda = monedaInput ? (monedaInput.toUpperCase() === "USD" ? "USD" : "ARS") : null;
    const atributos = Array.isArray(req.body.atributos)
      ? req.body.atributos.map((item) => normalizeText(item)).filter(Boolean)
      : [];
    const precioSugerido = Number(req.body.precioSugerido ?? 0);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    if (descripcion) {
      product.descripcion = descripcion;
    }
    product.marca = marca;
    product.atributos = atributos;
    if (!Number.isNaN(precioSugerido)) {
      product.precioSugerido = Math.max(precioSugerido, 0);
    }
    if (moneda) {
      product.moneda = moneda;
    }

    const duplicate = await Product.findOne({
      ...buildDuplicateQuery({
        descripcion: product.descripcion,
        marca: product.marca,
        atributos: product.atributos
      }),
      _id: { $ne: product._id }
    });
    if (duplicate) {
      return res.status(409).json({ message: "product already exists" });
    }

    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const listBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct("marca");
    const cleaned = brands.filter((brand) => brand && brand.trim()).sort();
    res.json(cleaned);
  } catch (error) {
    next(error);
  }
};

export const setProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "active must be boolean" });
    }
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }
    product.active = active;
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }
    const hasSales = await Sale.exists({ "items.productId": product._id });
    if (hasSales) {
      return res.status(409).json({ message: "product has sales and cannot be deleted" });
    }
    await product.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const importProducts = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items are required" });
    }
    const summary = { created: 0, updated: 0, unchanged: 0, skipped: 0 };
    for (const rawItem of items) {
      const descripcion = normalizeText(rawItem.descripcion || "");
      const marca = normalizeText(rawItem.marca || "");
      const monedaInput = normalizeText(rawItem.moneda || "ARS").toUpperCase();
      const moneda = monedaInput === "USD" ? "USD" : "ARS";
      const atributos = Array.isArray(rawItem.atributos)
        ? rawItem.atributos.map((item) => normalizeText(item)).filter(Boolean)
        : [];
      const precioSugerido = Number(rawItem.precioSugerido ?? 0);

      if (!descripcion) {
        summary.skipped += 1;
        continue;
      }

      const existing = await Product.findOne(buildDuplicateQuery({ descripcion, marca, atributos }));
      if (existing) {
        const nextPrecio = Math.max(precioSugerido, 0);
        const nextMoneda = moneda;
        if (existing.precioSugerido !== nextPrecio || existing.moneda !== nextMoneda) {
          existing.precioSugerido = nextPrecio;
          existing.moneda = nextMoneda;
          await existing.save();
          summary.updated += 1;
        } else {
          summary.unchanged += 1;
        }
        continue;
      }

      await Product.create({
        descripcion,
        marca,
        atributos,
        precioSugerido: Math.max(precioSugerido, 0),
        moneda,
        active: true
      });
      summary.created += 1;
    }

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};
