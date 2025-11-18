// middlewares/newsAdminAuth.js
import jwt from "jsonwebtoken";

export const verifyNewsAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ msg: "Invalid token" });
    req.adminId = decoded.id;
    next();
  });
};
