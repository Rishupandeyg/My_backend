// models/NewsAdmin.js
import mongoose from "mongoose";

const newsAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Force collection name: "newsadmins"
export default mongoose.model("NewsAdmin", newsAdminSchema, "newsadmins");
