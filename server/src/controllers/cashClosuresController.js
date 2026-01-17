import CashClosure from "../models/CashClosure.js";
import Sale from "../models/Sale.js";
import { endOfDay, startOfDay } from "../utils/normalize.js";

const buildTotals = (sales) => {
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

  const totalVentas = sales.reduce((sum, sale) => sum + sale.total, 0);

  return { totalesPorMetodo, totalesPorCuenta, totalVentas };
};

export const createCashClosure = async (req, res, next) => {
  try {
    const { fecha, notas, efectivoContado } = req.body;
    if (!fecha) {
      return res.status(400).json({ message: "fecha is required" });
    }

    const start = startOfDay(fecha);
    const end = endOfDay(fecha);
    const sales = await Sale.find({ fechaHora: { $gte: start, $lte: end } });
    const { totalesPorMetodo, totalesPorCuenta, totalVentas } = buildTotals(sales);
    const cantidadVentas = sales.length;
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

    res.status(201).json({ closure, ventas: sales });
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
      const ventas = await Sale.find({ fechaHora: { $gte: start, $lte: end } }).sort({ fechaHora: 1 });
      return res.json({ closure, ventas });
    }
    res.json({ closure });
  } catch (error) {
    next(error);
  }
};
