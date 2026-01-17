import Sale from "../models/Sale.js";
import { endOfDay, startOfDay } from "../utils/normalize.js";

export const getDailyReport = async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }
    const start = startOfDay(date);
    const end = endOfDay(date);

    const sales = await Sale.find({ fechaHora: { $gte: start, $lte: end } }).sort({ fechaHora: 1 });

    const totalVendido = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCobrado = sales.reduce((sum, sale) => sum + (sale.totalCobrado || 0), 0);
    const saldoPendiente = sales.reduce((sum, sale) => sum + (sale.saldoPendiente || 0), 0);
    const totalEnvioCadete = sales.reduce(
      (sum, sale) => sum + (sale.cadeteMontoPendiente || 0),
      0
    );
    const totalesPorMetodo = {};

    sales.forEach((sale) => {
      sale.pagos.forEach((pago) => {
        totalesPorMetodo[pago.metodo] = (totalesPorMetodo[pago.metodo] || 0) + pago.monto;
      });
    });

    res.json({
      fecha: date,
      totalVendido,
      totalCobrado,
      saldoPendiente,
      totalEnvioCadete,
      cantidadVentas: sales.length,
      totalesPorMetodo,
      ventas: sales
    });
  } catch (error) {
    next(error);
  }
};
