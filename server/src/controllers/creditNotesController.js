import CreditNote from "../models/CreditNote.js";

export const createCreditNote = async (req, res, next) => {
  try {
    const { saleId, tipo, metodo, cuentaTransferencia, monto, motivo } = req.body;
    if (!tipo || !metodo || monto === undefined || !motivo) {
      return res.status(400).json({ message: "tipo, metodo, monto, motivo are required" });
    }
    if (metodo === "TRANSFERENCIA" && !cuentaTransferencia) {
      return res.status(400).json({ message: "cuentaTransferencia is required for transfer" });
    }
    const note = await CreditNote.create({
      saleId,
      tipo,
      metodo,
      cuentaTransferencia,
      monto: Number(monto),
      motivo,
      userId: req.header("x-user-id") || undefined
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
