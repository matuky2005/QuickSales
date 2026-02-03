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

export const createInitialDebt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const monto = Number(req.body.monto || 0);
    const descripcion = normalizeText(req.body.descripcion || "Saldo inicial");
    if (!monto || monto <= 0) {
      return res.status(400).json({ message: "monto is required" });
    }
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "customer not found" });
    }

    const total = Math.round(monto);
    const sale = await Sale.create({
      fechaHora: new Date(),
      customerId: customer._id,
      customerNombreSnapshot: customer.nombre,
      items: [
        {
          descripcionSnapshot: descripcion,
          cantidad: 1,
          precioUnitario: total,
          subtotal: total,
          marca: "",
          atributos: []
        }
      ],
      recargo: { tipo: "fijo", valor: 0, montoCalculado: 0 },
      envio: { monto: 0, cobro: "INCLUIDO" },
      total,
      totalCobrado: 0,
      saldoPendiente: total,
      estado: "PENDIENTE",
      cadeteMontoPendiente: 0,
      pagos: [],
      auditoria: [
        {
          accion: "CREADA",
          detalle: { motivo: "DEUDA_INICIAL", userId: req.header("x-user-id") || null }
        }
      ]
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};
