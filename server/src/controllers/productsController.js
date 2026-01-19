import Product from "../models/Product.js";
import { buildContainsMatch, buildExactMatch, normalizeText } from "../utils/normalize.js";

export const createOrGetProduct = async (req, res, next) => {
  try {
    const descripcion = normalizeText(req.body.descripcion);
    const precioSugerido = Number(req.body.precioSugerido ?? 0);
    const marca = normalizeText(req.body.marca || "");
    const atributos = Array.isArray(req.body.atributos)
      ? req.body.atributos.map((item) => normalizeText(item)).filter(Boolean)
      : [];

    if (!descripcion) {
      return res.status(400).json({ message: "descripcion is required" });
    }

    let product = await Product.findOne({ descripcion: buildExactMatch(descripcion) });
    if (!product) {
      product = await Product.create({
        descripcion,
        marca,
        atributos,
        precioSugerido: Math.max(precioSugerido, 0)
      });
    } else {
      if (marca) {
        product.marca = marca;
      }
      if (atributos.length) {
        product.atributos = atributos;
      }
      if (precioSugerido >= 0) {
        product.precioSugerido = Math.max(precioSugerido, 0);
      }
      await product.save();
    }

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const listProducts = async (req, res, next) => {
  try {
    const query = normalizeText(req.query.query || "");
    const filter = query ? { descripcion: buildContainsMatch(query) } : {};
    const limit = query ? 10 : 200;
    const products = await Product.find(filter)
      .sort({ descripcion: 1 })
      .limit(limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
};
