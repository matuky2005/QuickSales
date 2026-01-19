import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import { buildContainsMatch, endOfDay, normalizeText, startOfDay } from "../utils/normalize.js";

export const getDailyReport = async (req, res, next) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }
    const start = startOfDay(date);
    const end = endOfDay(date);

    const sales = await Sale.find({
      fechaHora: { $gte: start, $lte: end },
      estado: { $ne: "CANCELADA" }
    }).sort({ fechaHora: 1 });

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

export const getBrandReport = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    const brandFilter = normalizeText(req.query.brand || "");
    if (!date && !startDate && !endDate) {
      return res.status(400).json({ message: "date or startDate/endDate are required" });
    }
    const rangeStart = date ? startOfDay(date) : startOfDay(startDate);
    const rangeEnd = date ? endOfDay(date) : endOfDay(endDate || startDate);

    const sales = await Sale.find({
      fechaHora: { $gte: rangeStart, $lte: rangeEnd },
      estado: { $ne: "CANCELADA" }
    }).lean();
    const productIds = new Set();
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (item.productId) {
          productIds.add(item.productId.toString());
        }
      });
    });
    const products = await Product.find({ _id: { $in: Array.from(productIds) } }).lean();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const totals = {};

    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const product = item.productId ? productMap.get(item.productId.toString()) : null;
        const brand = normalizeText(item.marca || product?.marca || "") || "Sin marca";
        if (brandFilter && !buildContainsMatch(brandFilter).test(brand)) {
          return;
        }
        if (!totals[brand]) {
          totals[brand] = { marca: brand, total: 0, cantidad: 0 };
        }
        totals[brand].total += Number(item.subtotal || 0);
        totals[brand].cantidad += Number(item.cantidad || 0);
      });
    });

    const marcas = Object.values(totals).sort((a, b) => b.total - a.total);
    res.json({
      fecha: date || null,
      rango: date ? null : { startDate, endDate: endDate || startDate },
      marca: brandFilter || null,
      marcas
    });
  } catch (error) {
    next(error);
  }
};
