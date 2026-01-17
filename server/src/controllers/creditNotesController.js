import CreditNote from "../models/CreditNote.js";

export const createCreditNote = async (req, res, next) => {
  try {
    const { saleId, tipo, monto, motivo } = req.body;
    if (!tipo || monto === undefined || !motivo) {
      return res.status(400).json({ message: "tipo, monto, motivo are required" });
    }
    const note = await CreditNote.create({
      saleId,
      tipo,
      monto: Number(monto),
      motivo
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const listCreditNotes = async (req, res, next) => {
  try {
    const { saleId } = req.query;
    const filter = saleId ? { saleId } : {};
    const notes = await CreditNote.find(filter).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    next(error);
  }
};
