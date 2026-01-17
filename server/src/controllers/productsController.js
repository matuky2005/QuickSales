import Product from "../models/Product.js";
import { buildContainsMatch, buildExactMatch, normalizeText } from "../utils/normalize.js";

export const createOrGetProduct = async (req, res, next) => {
  try {
    const descripcion = normalizeText(req.body.descripcion);
    const precioSugerido = Number(req.body.precioSugerido ?? 0);

    if (!descripcion) {
      return res.status(400).json({ message: "descripcion is required" });
    }

    let product = await Product.findOne({ descripcion: buildExactMatch(descripcion) });
    if (!product) {
      product = await Product.create({ descripcion, precioSugerido: Math.max(precioSugerido, 0) });
    }

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const query = normalizeText(req.query.query || "");
    if (!query) {
      return res.json([]);
    }
    const products = await Product.find({ descripcion: buildContainsMatch(query) })
      .sort({ descripcion: 1 })
      .limit(10);
    res.json(products);
  } catch (error) {
    next(error);
  }
};
