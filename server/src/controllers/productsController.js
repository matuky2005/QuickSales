import Product from "../models/Product.js";
import { buildContainsMatch, normalizeText } from "../utils/normalize.js";

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

    const product = await Product.create({
      descripcion,
      marca,
      atributos,
      precioSugerido: Math.max(precioSugerido, 0)
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
      filter.descripcion = buildContainsMatch(query);
    }
    if (brand) {
      filter.marca = buildContainsMatch(brand);
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
    const atributos = Array.isArray(req.body.atributos)
      ? req.body.atributos.map((item) => normalizeText(item)).filter(Boolean)
      : [];
    const precioSugerido = Number(req.body.precioSugerido ?? 0);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    if (descripcion && descripcion !== product.descripcion) {
      product.descripcion = descripcion;
    }
    if (marca) {
      product.marca = marca;
    }
    if (atributos.length) {
      product.atributos = atributos;
    }
    if (!Number.isNaN(precioSugerido)) {
      product.precioSugerido = Math.max(precioSugerido, 0);
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
