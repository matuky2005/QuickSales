import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { buildExactMatch, endOfDay, normalizeText, startOfDay } from "../utils/normalize.js";

const calculateTotals = (items, recargo, envio) => {
  const subtotalItems = items.reduce((sum, item) => sum + item.subtotal, 0);
  let montoCalculado = 0;
  if (recargo?.tipo === "porcentaje") {
    montoCalculado = Math.round((subtotalItems * recargo.valor) / 100);
  } else if (recargo?.tipo === "fijo") {
    montoCalculado = Math.round(recargo.valor || 0);
  }
  const envioMonto = Math.round(envio?.monto || 0);
  const total = subtotalItems + montoCalculado + envioMonto;
  return { subtotalItems, montoCalculado, total, envioMonto };
};

export const createSale = async (req, res, next) => {
  try {
    const {
      items = [],
      recargo = { tipo: "fijo", valor: 0 },
      envio = { monto: 0, cobro: "INCLUIDO" },
      pagos = [],
      customerNombreSnapshot,
      pagoEnElMomento = true
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "items are required" });
    }

    const normalizedItems = items.map((item) => {
      const descripcionSnapshot = normalizeText(item.descripcionSnapshot || item.descripcion || "");
      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(item.precioUnitario);
      const subtotal = Math.round(cantidad * precioUnitario);
      return { ...item, descripcionSnapshot, cantidad, precioUnitario, subtotal };
    });

    for (const item of normalizedItems) {
      if (!item.descripcionSnapshot || item.cantidad <= 0 || item.precioUnitario < 0) {
        return res.status(400).json({ message: "invalid item values" });
      }
    }

    const { total, montoCalculado, envioMonto } = calculateTotals(normalizedItems, recargo, envio);

    const pagosNormalizados = pagos.map((pago) => ({
      ...pago,
      monto: Number(pago.monto || 0),
      fechaHora: pago.fechaHora ? new Date(pago.fechaHora) : new Date()
    }));
    const pagoTotal = pagosNormalizados.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
    const cobroEnCaja = Math.max(total - envioMonto, 0);
    if (Math.round(pagoTotal) > Math.round(cobroEnCaja)) {
      return res.status(400).json({ message: "payments total cannot exceed expected cash" });
    }
    const saldoPendiente = Math.max(Math.round(cobroEnCaja - pagoTotal), 0);
    const cadeteMontoPendiente = envio?.cobro === "CADETE" ? Math.round(envioMonto) : 0;

    let customerId;
    let customerNombreSnapshotValue;
    if (customerNombreSnapshot) {
      const normalizedName = normalizeText(customerNombreSnapshot);
      customerNombreSnapshotValue = normalizedName;
      let customer = await Customer.findOne({ nombre: buildExactMatch(normalizedName) });
      if (!customer) {
        customer = await Customer.create({ nombre: normalizedName });
      }
      customerId = customer._id;
    }

    const mappedItems = [];
    for (const item of normalizedItems) {
      let product = null;
      if (item.productId) {
        product = await Product.findById(item.productId);
      }
      if (!product) {
        product = await Product.findOne({ descripcion: buildExactMatch(item.descripcionSnapshot) });
      }
      if (!product) {
        product = await Product.create({
          descripcion: item.descripcionSnapshot,
          precioSugerido: item.precioUnitario
        });
      } else {
        product.precioSugerido = item.precioUnitario;
        await product.save();
      }
      mappedItems.push({
        ...item,
        productId: product._id,
        descripcionSnapshot: item.descripcionSnapshot
      });
    }

    const estado = saldoPendiente === 0 && pagoEnElMomento ? "PAGADA" : "PENDIENTE";

    const sale = await Sale.create({
      fechaHora: req.body.fechaHora ? new Date(req.body.fechaHora) : new Date(),
      customerId,
      customerNombreSnapshot: customerNombreSnapshotValue,
      items: mappedItems,
      recargo: {
        tipo: recargo.tipo || "fijo",
        valor: Number(recargo.valor || 0),
        montoCalculado
      },
      envio: {
        monto: envioMonto,
        cobro: envio?.cobro === "CADETE" ? "CADETE" : "INCLUIDO"
      },
      total,
      totalCobrado: Math.round(pagoTotal),
      saldoPendiente,
      estado,
      cadeteMontoPendiente,
      cadeteRendidoAt: cadeteMontoPendiente > 0 ? null : undefined,
      pagos: pagosNormalizados,
      auditoria: [
        {
          accion: "CREADA",
          detalle: { pagoEnElMomento, estado }
        }
      ]
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

export const addPayment = async (req, res, next) => {
  try {
    const { pagos = [] } = req.body;
    if (!pagos.length) {
      return res.status(400).json({ message: "payments are required" });
    }
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "sale not found" });
    }
    const nuevosPagos = pagos.map((pago) => ({
      ...pago,
      monto: Number(pago.monto || 0),
      fechaHora: new Date()
    }));
    const nuevoTotalCobrado =
      sale.totalCobrado + nuevosPagos.reduce((sum, pago) => sum + pago.monto, 0);
    const totalCaja = sale.total - (sale.envio?.monto || 0);
    if (nuevoTotalCobrado > totalCaja) {
      return res.status(400).json({ message: "payments total cannot exceed sale total" });
    }
    sale.totalCobrado = Math.round(nuevoTotalCobrado);
    sale.saldoPendiente = Math.max(Math.round(totalCaja - sale.totalCobrado), 0);
    sale.estado = sale.saldoPendiente === 0 ? "PAGADA" : "PENDIENTE";
    sale.pagos.push(...nuevosPagos);
    sale.auditoria.push({
      accion: "PAGO_AGREGADO",
      detalle: { pagos: nuevosPagos }
    });
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "sale not found" });
    }
    const { items = sale.items, recargo = sale.recargo, envio = sale.envio } = req.body;

    const normalizedItems = items.map((item) => {
      const descripcionSnapshot = normalizeText(item.descripcionSnapshot || item.descripcion || "");
      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(item.precioUnitario);
      const subtotal = Math.round(cantidad * precioUnitario);
      return { ...item, descripcionSnapshot, cantidad, precioUnitario, subtotal };
    });

    for (const item of normalizedItems) {
      if (!item.descripcionSnapshot || item.cantidad <= 0 || item.precioUnitario < 0) {
        return res.status(400).json({ message: "invalid item values" });
      }
    }

    const { total, montoCalculado, envioMonto } = calculateTotals(
      normalizedItems,
      recargo,
      envio
    );

    sale.items = normalizedItems;
    sale.recargo = {
      tipo: recargo.tipo || "fijo",
      valor: Number(recargo.valor || 0),
      montoCalculado
    };
    sale.envio = {
      monto: envioMonto,
      cobro: envio?.cobro === "CADETE" ? "CADETE" : "INCLUIDO"
    };
    sale.total = total;
    const totalCaja = total - envioMonto;
    sale.saldoPendiente = Math.max(Math.round(totalCaja - sale.totalCobrado), 0);
    sale.estado = sale.saldoPendiente === 0 ? "PAGADA" : "PENDIENTE";
    sale.auditoria.push({
      accion: "ACTUALIZADA",
      detalle: { total, recargo: sale.recargo, envio: sale.envio }
    });

    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const markCadeteRendido = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "sale not found" });
    }
    sale.cadeteMontoPendiente = 0;
    sale.cadeteRendidoAt = new Date();
    await sale.save();
    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const listSales = async (req, res, next) => {
  try {
    const { status, date, customer } = req.query;
    const filter = {};
    if (status) {
      filter.estado = status;
    }
    if (date) {
      filter.fechaHora = { $gte: startOfDay(date), $lte: endOfDay(date) };
    }
    if (customer) {
      filter.customerNombreSnapshot = new RegExp(customer, "i");
    }
    const sales = await Sale.find(filter).sort({ fechaHora: -1 }).limit(100);
    res.json(sales);
  } catch (error) {
    next(error);
  }
};
