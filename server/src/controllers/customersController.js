import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import { buildContainsMatch, buildExactMatch, endOfDay, normalizeText, startOfDay } from "../utils/normalize.js";

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
    const filter = query ? { nombre: buildContainsMatch(query) } : {};
    const limit = query ? 10 : 200;
    const customers = await Customer.find(filter)
      .sort({ nombre: 1 })
      .limit(limit);
    res.json(customers);
  } catch (error) {
    next(error);
  }
};

export const getCustomerStatement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "customer not found" });
    }
    const filter = { customerId: id, estado: { $ne: "CANCELADA" } };
    if (startDate || endDate) {
      filter.fechaHora = {
        ...(startDate ? { $gte: startOfDay(startDate) } : {}),
        ...(endDate ? { $lte: endOfDay(endDate) } : {})
      };
    }
    const sales = await Sale.find(filter).sort({ fechaHora: -1 }).lean();
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCobrado = sales.reduce((sum, sale) => sum + (sale.totalCobrado || 0), 0);
    const saldoPendiente = sales.reduce((sum, sale) => sum + (sale.saldoPendiente || 0), 0);

    res.json({
      customer: { _id: customer._id, nombre: customer.nombre },
      total,
      totalCobrado,
      saldoPendiente,
      sales
    });
  } catch (error) {
    next(error);
  }
};
