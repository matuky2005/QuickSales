import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { buildExactMatch, normalizeText } from "../utils/normalize.js";

const calculateTotals = (items, recargo) => {
  const subtotalItems = items.reduce((sum, item) => sum + item.subtotal, 0);
  let montoCalculado = 0;
  if (recargo?.tipo === "porcentaje") {
    montoCalculado = Math.round((subtotalItems * recargo.valor) / 100);
  } else if (recargo?.tipo === "fijo") {
    montoCalculado = Math.round(recargo.valor || 0);
  }
  const total = subtotalItems + montoCalculado;
  return { subtotalItems, montoCalculado, total };
};

export const createSale = async (req, res, next) => {
  try {
    const { items = [], recargo = { tipo: "fijo", valor: 0 }, pagos = [], customerNombreSnapshot } = req.body;

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

    const { total, montoCalculado } = calculateTotals(normalizedItems, recargo);

    const pagoTotal = pagos.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
    if (Math.round(pagoTotal) !== Math.round(total)) {
      return res.status(400).json({ message: "payments total must match sale total" });
    }

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
      total,
      pagos
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};
