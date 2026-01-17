import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    descripcion: { type: String, required: true, trim: true, unique: true },
    precioSugerido: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productSchema.index({ descripcion: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);
