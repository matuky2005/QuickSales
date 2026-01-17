import Customer from "../models/Customer.js";
import { buildContainsMatch, buildExactMatch, normalizeText } from "../utils/normalize.js";

export const createOrGetCustomer = async (req, res, next) => {
  try {
    const nombre = normalizeText(req.body.nombre);
    if (!nombre) {
      return res.status(400).json({ message: "nombre is required" });
    }

    let customer = await Customer.findOne({ nombre: buildExactMatch(nombre) });
    if (!customer) {
      customer = await Customer.create({ nombre });
    }

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const listCustomers = async (req, res, next) => {
  try {
    const query = normalizeText(req.query.query || "");
    if (!query) {
      return res.json([]);
    }
    const customers = await Customer.find({ nombre: buildContainsMatch(query) })
      .sort({ nombre: 1 })
      .limit(10);
    res.json(customers);
  } catch (error) {
    next(error);
  }
};
