import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
  {
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
    tipo: { type: String, enum: ["CREDITO", "DEBITO"], required: true },
    monto: { type: Number, required: true, min: 0 },
    motivo: { type: String, required: true },
    fechaHora: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("CreditNote", creditNoteSchema);
