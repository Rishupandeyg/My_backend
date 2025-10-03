// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import Candidate from "../models/Candidate.js";

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization") || req.header("authorization");
  const token = authHeader ? authHeader.split(" ")[1] : null;

  if (!token) return res.status(401).json({ msg: "No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded?.user?.id || decoded?.id || decoded?._id,
      role: decoded?.role || decoded?.user?.role || "user",
    };

    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

// Role-based authorization helper
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// Paid candidate check helper
export const checkPaidCandidate = async (req, res, next) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Access denied: candidates only" });
  }

  try {
    const candidate = await Candidate.findById(req.user.id);
    if (!candidate || !candidate.isPaid) {
      return res.status(403).json({ message: "Please complete payment to access this resource" });
    }

    // Optionally attach full candidate info
    req.user.full = candidate;

    next();
  } catch (err) {
    console.error("Paid check error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default auth;









// // src/middlewares/auth.js
// import jwt from "jsonwebtoken";

// const auth = (req, res, next) => {
//   // Accept "Authorization: Bearer <token>" or raw token
//   const authHeader = req.header("Authorization") || req.header("authorization");
//   const token = authHeader ? authHeader.split(" ")[1] : null;

//   if (!token) {
//     return res.status(401).json({ msg: "No token, access denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Support both payload shapes:
//     // 1) { user: { id: ..., role: ... } }
//     // 2) { id: ..., role: ... }
//     req.user = {
//       id: decoded?.user?.id || decoded?.id || decoded?._id,
//       role: decoded?.role || decoded?.user?.role || "user", // default role
//     };

//     next();
//   } catch (err) {
//     return res.status(401).json({ msg: "Invalid token" });
//   }
// };

// export default auth;
