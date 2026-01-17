import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, unique: true }
  },
  { timestamps: true }
);

customerSchema.index({ nombre: 1 }, { unique: true });

export default mongoose.model("Customer", customerSchema);
