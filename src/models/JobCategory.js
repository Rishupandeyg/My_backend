// server/models/JobCategory.js
const mongoose = require("mongoose");

const jobCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  // any other fields you need
}, { timestamps: true });

module.exports = mongoose.model("JobCategory", jobCategorySchema);
