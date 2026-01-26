import mongoose from "mongoose";

const cashMovementSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["DEPOSITO", "PAGO", "RETIRO"], required: true },
    fecha: { type: String, required: true },
    descripcion: { type: String, required: true },
    observacion: { type: String },
    monto: { type: Number, required: true, min: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("CashMovement", cashMovementSchema);
