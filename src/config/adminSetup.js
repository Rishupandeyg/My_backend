// src/config/adminSetup.js
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    let admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      const hash = await bcrypt.hash(adminPassword, 10);
      admin = new Admin({
        name: "Super Admin",
        email: adminEmail,
        mobile: "0000000000",
        password: hash,
        role: "admin",
        isVerified: true,
      });
      await admin.save();
      console.log(" Admin account created");
    } else {
      console.log("Admin already exists");
    }
  } catch (err) {
    console.error(" Admin creation error:", err);
  }
};

export default createAdmin;
