// src/middlewares/auth.js
import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  // Accept "Authorization: Bearer <token>" or raw token
  const authHeader = req.header("Authorization") || req.header("authorization");
  const token = authHeader ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both payload shapes:
    // 1) { user: { id: ..., role: ... } }
    // 2) { id: ..., role: ... }
    req.user = {
      id: decoded?.user?.id || decoded?.id || decoded?._id,
      role: decoded?.role || decoded?.user?.role || "user", // default role
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

export default auth;
