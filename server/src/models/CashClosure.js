import mongoose from "mongoose";

const cashClosureSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    totalesPorMetodo: { type: Object, required: true },
    totalesPorCuenta: { type: Object, required: true },
    totalVentas: { type: Number, required: true },
    cantidadVentas: { type: Number, required: true },
    efectivoContado: { type: Number },
    diferencia: { type: Number },
    notas: { type: String }
  },
  { timestamps: true }
);

cashClosureSchema.index({ fecha: 1 }, { unique: true });

export default mongoose.model("CashClosure", cashClosureSchema);
