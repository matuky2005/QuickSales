import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    descripcion: { type: String, required: true, trim: true },
    marca: { type: String, trim: true, default: "" },
    atributos: { type: [String], default: [] },
    precioSugerido: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
