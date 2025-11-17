// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 } // default 0 so first increment => 1
}, { timestamps: true });

export default mongoose.model("Counter", counterSchema);
