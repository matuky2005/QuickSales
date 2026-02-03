import CashClosure from "../models/CashClosure.js";
import CreditNote from "../models/CreditNote.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { endOfDay, startOfDay } from "../utils/normalize.js";

const buildTotals = (sales, notes = [], start, end) => {
  const totalesPorMetodo = {};
  const totalesPorCuenta = {};
  let totalCobrado = 0;

  sales.forEach((sale) => {
    sale.pagos.forEach((pago) => {
      const pagoFecha = pago.fechaHora ? new Date(pago.fechaHora) : new Date(sale.fechaHora);
      if (pagoFecha < start || pagoFecha > end) {
        return;
      }
      totalesPorMetodo[pago.metodo] = (totalesPorMetodo[pago.metodo] || 0) + pago.monto;
      totalCobrado += pago.monto;
      if (pago.metodo === "TRANSFERENCIA" && pago.cuentaTransferencia) {
        totalesPorCuenta[pago.cuentaTransferencia] =
          (totalesPorCuenta[pago.cuentaTransferencia] || 0) + pago.monto;
      }
    });
  });

  notes.forEach((note) => {
    if (note.fechaHora < start || note.fechaHora > end) {
      return;
    }
    const sign = note.tipo === "CREDITO" ? -1 : 1;
    totalesPorMetodo[note.metodo] = (totalesPorMetodo[note.metodo] || 0) + sign * note.monto;
    if (note.metodo === "TRANSFERENCIA" && note.cuentaTransferencia) {
      totalesPorCuenta[note.cuentaTransferencia] =
        (totalesPorCuenta[note.cuentaTransferencia] || 0) + sign * note.monto;
    }
    totalCobrado += sign * note.monto;
  });

  return { totalesPorMetodo, totalesPorCuenta, totalCobrado: Math.round(totalCobrado) };
};

const buildPendingByCustomer = (sales) => {
  const pendingMap = new Map();
  sales.forEach((sale) => {
    const key = sale.customerNombreSnapshot || "Sin cliente";
    const current = pendingMap.get(key) || 0;
    pendingMap.set(key, current + (sale.saldoPendiente || 0));
  });
  return Array.from(pendingMap.entries())
    .map(([cliente, saldoPendiente]) => ({ cliente, saldoPendiente }))
    .sort((a, b) => b.saldoPendiente - a.saldoPendiente);
};

const enrichSalesItems = async (sales) => {
  const productIds = new Set();
  sales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      if (item.productId) {
        productIds.add(item.productId.toString());
      }
    });
  });
  if (!productIds.size) {
    return sales;
  }
  const products = await Product.find({ _id: { $in: Array.from(productIds) } }).lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  return sales.map((sale) => ({
    ...sale,
    items: (sale.items || []).map((item) => {
      const product = item.productId ? productMap.get(item.productId.toString()) : null;
      return {
        ...item,
        marca: item.marca || product?.marca || "",
        atributos: item.atributos?.length ? item.atributos : product?.atributos || []
      };
    })
  }));
};

export const createCashClosure = async (req, res, next) => {
  try {
    const { fecha, notas, efectivoContado } = req.body;
    if (!fecha) {
      return res.status(400).json({ message: "fecha is required" });
    }

    const start = startOfDay(fecha);
    const end = endOfDay(fecha);
    const sales = await Sale.find({
      estado: { $ne: "CANCELADA" },
      pagos: { $elemMatch: { fechaHora: { $gte: start, $lte: end } } }
    }).lean();
    const notes = await CreditNote.find({ fechaHora: { $gte: start, $lte: end } });
    const pendingSales = await Sale.find({
      estado: { $ne: "CANCELADA" },
      saldoPendiente: { $gt: 0 }
    }).lean();
    const enrichedSales = await enrichSalesItems(sales);
    const { totalesPorMetodo, totalesPorCuenta, totalCobrado } = buildTotals(
      enrichedSales,
      notes,
      start,
      end
    );
    const cantidadVentas = enrichedSales.length;
    const diferencia =
      typeof efectivoContado === "number"
        ? Math.round(efectivoContado - (totalesPorMetodo.EFECTIVO || 0))
        : undefined;

    const existing = await CashClosure.findOne({ fecha });
    if (existing) {
      return res.status(409).json({ message: "cash closure already exists for date" });
    }

    const closure = await CashClosure.create({
      fecha,
      totalesPorMetodo,
      totalesPorCuenta,
      totalVentas: totalCobrado,
      cantidadVentas,
      efectivoContado,
      diferencia,
      notas
    });
    const pendingByCustomer = buildPendingByCustomer(pendingSales);

    res.status(201).json({ closure, ventas: enrichedSales, pendingByCustomer });
  } catch (error) {
    next(error);
  }
};

export const getCashClosure = async (req, res, next) => {
  try {
    const { date, detail } = req.query;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }
    const closure = await CashClosure.findOne({ fecha: date });
    if (!closure) {
      return res.json(null);
    }
    if (detail === "true") {
      const start = startOfDay(date);
      const end = endOfDay(date);
      const ventas = await Sale.find({
        estado: { $ne: "CANCELADA" },
        pagos: { $elemMatch: { fechaHora: { $gte: start, $lte: end } } }
      })
        .sort({ fechaHora: 1 })
        .lean();
      const pendingSales = await Sale.find({
        estado: { $ne: "CANCELADA" },
        saldoPendiente: { $gt: 0 }
      }).lean();
      const enrichedSales = await enrichSalesItems(ventas);
      const pendingByCustomer = buildPendingByCustomer(pendingSales);
      return res.json({ closure, ventas: enrichedSales, pendingByCustomer });
    }
    const pendingSales = await Sale.find({
      estado: { $ne: "CANCELADA" },
      saldoPendiente: { $gt: 0 }
    }).lean();
    const pendingByCustomer = buildPendingByCustomer(pendingSales);
    res.json({ closure, pendingByCustomer });
  } catch (error) {
    next(error);
  }
};
