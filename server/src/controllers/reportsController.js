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

export const getCustomerReport = async (req, res, next) => {
  try {
    const { date, startDate, endDate, customerId } = req.query;
    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }
    if (!date && !startDate && !endDate) {
      return res.status(400).json({ message: "date or startDate/endDate are required" });
    }
    const rangeStart = date ? startOfDay(date) : startOfDay(startDate);
    const rangeEnd = date ? endOfDay(date) : endOfDay(endDate || startDate);

    const sales = await Sale.find({
      fechaHora: { $gte: rangeStart, $lte: rangeEnd },
      customerId,
      estado: { $ne: "CANCELADA" }
    }).lean();
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCobrado = sales.reduce((sum, sale) => sum + (sale.totalCobrado || 0), 0);
    const saldoPendiente = sales.reduce((sum, sale) => sum + (sale.saldoPendiente || 0), 0);

    res.json({
      fecha: date || null,
      rango: date ? null : { startDate, endDate: endDate || startDate },
      customerId,
      total,
      totalCobrado,
      saldoPendiente,
      ventas: sales
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesItemsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, brand, sort = "descripcion" } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    const brandFilter = normalizeText(brand || "");
    const rangeStart = startOfDay(startDate);
    const rangeEnd = endOfDay(endDate);

    const sales = await Sale.find({
      fechaHora: { $gte: rangeStart, $lte: rangeEnd },
      estado: { $ne: "CANCELADA" }
    }).lean();

    const totalsMap = new Map();
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const descripcion = normalizeText(item.descripcionSnapshot || "");
        const marca = normalizeText(item.marca || "") || "Sin marca";
        const atributos = Array.isArray(item.atributos)
          ? item.atributos.map((atributo) => normalizeText(atributo)).filter(Boolean)
          : [];
        if (brandFilter && !buildContainsMatch(brandFilter).test(marca)) {
          return;
        }
        const key = `${descripcion}||${marca}||${atributos.join("|")}`;
        if (!totalsMap.has(key)) {
          totalsMap.set(key, {
            descripcion,
            marca,
            atributos,
            cantidad: 0,
            importe: 0
          });
        }
        const entry = totalsMap.get(key);
        entry.cantidad += Number(item.cantidad || 0);
        entry.importe += Number(item.subtotal || 0);
      });
    });

    const items = Array.from(totalsMap.values());
    items.sort((a, b) => {
      if (sort === "cantidad") {
        return b.cantidad - a.cantidad;
      }
      if (sort === "importe") {
        return b.importe - a.importe;
      }
      return a.descripcion.localeCompare(b.descripcion, "es", { sensitivity: "base" });
    });

    res.json({
      rango: { startDate, endDate },
      marca: brandFilter || null,
      orden: sort,
      items
    });
  } catch (error) {
    next(error);
  }
};
