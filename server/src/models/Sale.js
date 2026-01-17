import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    descripcionSnapshot: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const recargoSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["porcentaje", "fijo"], default: "fijo" },
    valor: { type: Number, default: 0 },
    montoCalculado: { type: Number, default: 0 }
  },
  { _id: false }
);

const pagoSchema = new mongoose.Schema(
  {
    metodo: {
      type: String,
      enum: ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "QR"],
      required: true
    },
    tipoTarjeta: { type: String },
    cuentaTransferencia: { type: String },
    monto: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    fechaHora: { type: Date, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerNombreSnapshot: { type: String },
    items: { type: [saleItemSchema], required: true },
    recargo: { type: recargoSchema, default: () => ({}) },
    total: { type: Number, required: true, min: 0 },
    pagos: { type: [pagoSchema], required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Sale", saleSchema);
