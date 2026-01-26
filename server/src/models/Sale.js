import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    descripcionSnapshot: { type: String, required: true },
    marca: { type: String, default: "" },
    atributos: { type: [String], default: [] },
    cantidad: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    moneda: { type: String, enum: ["ARS", "USD"], default: "ARS" },
    precioUnitarioOriginal: { type: Number },
    tipoCambio: { type: Number }
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

const envioSchema = new mongoose.Schema(
  {
    monto: { type: Number, default: 0 },
    cobro: { type: String, enum: ["INCLUIDO", "CADETE"], default: "INCLUIDO" }
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
    monto: { type: Number, required: true, min: 0 },
    fechaHora: { type: Date, default: Date.now }
  },
  { _id: false }
);

const auditSchema = new mongoose.Schema(
  {
    accion: {
      type: String,
      enum: ["CREADA", "ACTUALIZADA", "PAGO_AGREGADO", "CANCELADA"],
      required: true
    },
    detalle: { type: Object },
    fechaHora: { type: Date, default: Date.now }
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
    envio: { type: envioSchema, default: () => ({}) },
    total: { type: Number, required: true, min: 0 },
    totalCobrado: { type: Number, required: true, min: 0 },
    saldoPendiente: { type: Number, required: true, min: 0 },
    estado: { type: String, enum: ["PENDIENTE", "PAGADA", "CANCELADA"], default: "PENDIENTE" },
    cadeteMontoPendiente: { type: Number, required: true, min: 0 },
    cadeteRendidoAt: { type: Date },
    cierreCajaId: { type: mongoose.Schema.Types.ObjectId, ref: "CashClosure" },
    cierreCajaAt: { type: Date },
    pagos: { type: [pagoSchema], default: [] },
    auditoria: { type: [auditSchema], default: [] }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Sale", saleSchema);
