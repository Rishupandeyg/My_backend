// import bcrypt from "bcryptjs";
// import NewsAdmin from "../models/NewsAdmin";
// const createNewsAdmin = async () => {
//   try {
//     const newsadminEmail = process.env.NEWSADMIN_EMAIL;
//     const newsadminPassword = process.env.NEWSADMIN_PASSWORD;
//      let newsadmin = await NewsAdmin.findOne({ email: newsadminEmail });
//         if (!newsadmin) {
//           const hash = await bcrypt.hash(newsadminPassword, 10);
//           newsadmin = new NewsAdmin({
//             name: "News Admin",
//             email: adminEmail,
//             mobile: "1111111111",
//             password: hash,
//             role: "newsadmin",
//             isVerified: true,
//           });
//           await admin.save();
//           console.log(" News Admin account created");
//         } else {
//           console.log("News Admin already exists");
//         }
//       } catch (err) {
//         console.error(" News Admin creation error:", err);
//       }
//     };
    
//     export default createNewsAdmin;
    