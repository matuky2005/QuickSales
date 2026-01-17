import CashMovement from "../models/CashMovement.js";

export const createCashMovement = async (req, res, next) => {
  try {
    const { tipo, fecha, descripcion, observacion, monto } = req.body;
    if (!tipo || !fecha || !descripcion || monto === undefined) {
      return res.status(400).json({ message: "tipo, fecha, descripcion, monto are required" });
    }
    const movement = await CashMovement.create({
      tipo,
      fecha,
      descripcion,
      observacion,
      monto: Number(monto),
      userId: req.header("x-user-id") || undefined
    });
    res.status(201).json(movement);
  } catch (error) {
    next(error);
  }
};

export const listCashMovements = async (req, res, next) => {
  try {
    const { startDate, endDate, descripcion } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.fecha = {
        ...(startDate ? { $gte: startDate } : {}),
        ...(endDate ? { $lte: endDate } : {})
      };
    }
    if (descripcion) {
      filter.descripcion = new RegExp(descripcion, "i");
    }
    const movements = await CashMovement.find(filter).sort({ fecha: -1, createdAt: -1 }).limit(200);
    res.json(movements);
  } catch (error) {
    next(error);
  }
};
