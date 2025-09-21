import mongoose from "mongoose";

const employerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    yearOfEstablishment: { type: Number, required: true },
    password: { type: String, required: true },
    gstNumber: { type: String },
    websiteLink: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    vacancy: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Employer", employerSchema);
