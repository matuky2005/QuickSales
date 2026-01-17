import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
