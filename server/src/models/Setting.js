import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("Setting", settingSchema);
