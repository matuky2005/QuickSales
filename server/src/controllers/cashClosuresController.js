import CashClosure from "../models/CashClosure.js";
import CreditNote from "../models/CreditNote.js";
import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { endOfDay, startOfDay } from "../utils/normalize.js";

const buildTotals = (sales, notes = []) => {
  const totalesPorMetodo = {};
  const totalesPorCuenta = {};

  sales.forEach((sale) => {
    sale.pagos.forEach((pago) => {
      totalesPorMetodo[pago.metodo] = (totalesPorMetodo[pago.metodo] || 0) + pago.monto;
      if (pago.metodo === "TRANSFERENCIA" && pago.cuentaTransferencia) {
        totalesPorCuenta[pago.cuentaTransferencia] =
          (totalesPorCuenta[pago.cuentaTransferencia] || 0) + pago.monto;
      }
    });
  });

  notes.forEach((note) => {
    const sign = note.tipo === "CREDITO" ? -1 : 1;
    totalesPorMetodo[note.metodo] = (totalesPorMetodo[note.metodo] || 0) + sign * note.monto;
    if (note.metodo === "TRANSFERENCIA" && note.cuentaTransferencia) {
      totalesPorCuenta[note.cuentaTransferencia] =
        (totalesPorCuenta[note.cuentaTransferencia] || 0) + sign * note.monto;
    }
  });

  const totalVentas = sales.reduce((sum, sale) => sum + (sale.total - (sale.envio?.monto || 0)), 0);
  const totalNotas = notes.reduce(
    (sum, note) => sum + (note.tipo === "CREDITO" ? -note.monto : note.monto),
    0
  );

  return { totalesPorMetodo, totalesPorCuenta, totalVentas: totalVentas + totalNotas };
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
    const sales = await Sale.find({ fechaHora: { $gte: start, $lte: end } }).lean();
    const notes = await CreditNote.find({ fechaHora: { $gte: start, $lte: end } });
    const enrichedSales = await enrichSalesItems(sales);
    const { totalesPorMetodo, totalesPorCuenta, totalVentas } = buildTotals(enrichedSales, notes);
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
      totalVentas,
      cantidadVentas,
      efectivoContado,
      diferencia,
      notas
    });

    await Sale.updateMany(
      { fechaHora: { $gte: start, $lte: end }, cierreCajaAt: { $exists: false } },
      {
        $set: {
          saldoPendiente: 0,
          cierreCajaId: closure._id,
          cierreCajaAt: new Date()
        }
      }
    );

    res.status(201).json({ closure, ventas: enrichedSales });
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
      const ventas = await Sale.find({ fechaHora: { $gte: start, $lte: end } })
        .sort({ fechaHora: 1 })
        .lean();
      const enrichedSales = await enrichSalesItems(ventas);
      return res.json({ closure, ventas: enrichedSales });
    }
    res.json({ closure });
  } catch (error) {
    next(error);
  }
};
