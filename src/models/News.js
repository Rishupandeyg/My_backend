// // src/models/News.js
// import mongoose from "mongoose";

// const NewsSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   content: { type: String, required: true },
//   image: { type: String },
//   category: { type: String },
//   date: { type: Date, default: Date.now },
// }, { timestamps: true });

// const News = mongoose.models?.News || mongoose.model("News", NewsSchema);
// export default News;

// src/models/News.js
import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },

    mediaUrl: { type: String, required: true },   // 🔥 NEW
    mediaType: { type: String, required: true },  // 🔥 NEW ("image" | "video")

    category: { type: String },
  },
  { timestamps: true }
);

const News = mongoose.models.News || mongoose.model("News", NewsSchema);
export default News;
