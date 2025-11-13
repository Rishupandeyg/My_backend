// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import Candidate from "../models/Candidate.js";
import Employer from "../models/Employer.js";
import Admin from "../models/Admin.js";

const auth = async (req, res, next) => {
  // try to read Authorization header case-insensitively and support "Bearer <token>" or just token
  const authHeader = req.header("Authorization") || req.header("authorization");
  const token = authHeader ? (authHeader.split(" ")[1] || authHeader) : null;

  if (!token) {
    console.log(`AUTH DEBUG: No token provided for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ msg: "No token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("AUTH DEBUG: token decoded ->", decoded);

    // Normalize user id and role — set both `id` and `_id` for compatibility with various controllers/models
    const resolvedUserId = decoded?.user?.id || decoded?.id || decoded?._id || null;
    const resolvedRole = decoded?.role || decoded?.user?.role || "user";

    req.user = {
      // set both shapes so downstream code expecting either will work
      id: resolvedUserId,
      _id: resolvedUserId,
      role: resolvedRole,
      // keep the decoded payload for debugging or extra info if needed
      raw: decoded,
    };

    console.log("AUTH DEBUG: resolved req.user ->", req.user);

    // Check user existence based on role (keeps original behavior: returns 404 if user missing)
    if (req.user.role === "candidate") {
      const candidate = await Candidate.findById(req.user.id);
      if (!candidate) {
        console.log("AUTH DEBUG: Candidate not found for id:", req.user.id);
        return res.status(404).json({ msg: "Candidate not found" });
      }
    } else if (req.user.role === "employer") {
      const employer = await Employer.findById(req.user.id);
      if (!employer) {
        console.log("AUTH DEBUG: Employer not found for id:", req.user.id);
        return res.status(404).json({ msg: "Employer not found" });
      }
    } else if (req.user.role === "admin") {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        console.log("AUTH DEBUG: Admin not found for id:", req.user.id);
        return res.status(404).json({ msg: "Admin not found" });
      }
    }

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired, please login again", expiredAt: err.expiredAt });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid token" });
    }

    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ✅ Role-based authorization helper (unchanged)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};

// Paid candidate check helper (unchanged)
export const checkPaidCandidate = async (req, res, next) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Access denied: candidates only" });
  }

  try {
    const candidate = await Candidate.findById(req.user.id);
    if (!candidate || !candidate.isPaid) {
      return res
        .status(403)
        .json({ message: "Please complete payment to access this resource" });
    }

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
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";

// const auth = async (req, res, next) => {
//   // try to read Authorization header case-insensitively and support "Bearer <token>" or just token
//   const authHeader = req.header("Authorization") || req.header("authorization");
//   const token = authHeader ? (authHeader.split(" ")[1] || authHeader) : null;

//   if (!token) {
//     console.log(`AUTH DEBUG: No token provided for ${req.method} ${req.originalUrl}`);
//     return res.status(401).json({ msg: "No token, access denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("AUTH DEBUG: token decoded ->", decoded);

//     req.user = {
//       id: decoded?.user?.id || decoded?.id || decoded?._id,
//       role: decoded?.role || decoded?.user?.role || "user",
//     };

//     console.log("AUTH DEBUG: resolved req.user ->", req.user);

//     // ✅ Check user existence based on role (keeps original behavior: returns 404 if user missing)
//     if (req.user.role === "candidate") {
//       const candidate = await Candidate.findById(req.user.id);
//       if (!candidate) {
//         console.log("AUTH DEBUG: Candidate not found for id:", req.user.id);
//         return res.status(404).json({ msg: "Candidate not found" });
//       }
//     } else if (req.user.role === "employer") {
//       const employer = await Employer.findById(req.user.id);
//       if (!employer) {
//         console.log("AUTH DEBUG: Employer not found for id:", req.user.id);
//         return res.status(404).json({ msg: "Employer not found" });
//       }
//     } else if (req.user.role === "admin") {
//       const admin = await Admin.findById(req.user.id);
//       if (!admin) {
//         console.log("AUTH DEBUG: Admin not found for id:", req.user.id);
//         return res.status(404).json({ msg: "Admin not found" });
//       }
//     }

//     next();
//   } catch (err) {
//     console.error("AUTH ERROR:", err);

//     if (err.name === "TokenExpiredError") {
//       return res.status(401).json({ msg: "Token expired, please login again", expiredAt: err.expiredAt });
//     }

//     if (err.name === "JsonWebTokenError") {
//       return res.status(401).json({ msg: "Invalid token" });
//     }

//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };

// // ✅ Role-based authorization helper (unchanged)
// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied: insufficient role" });
//     }
//     next();
//   };
// };

// // ✅ Paid candidate check helper (unchanged)
// export const checkPaidCandidate = async (req, res, next) => {
//   if (req.user.role !== "candidate") {
//     return res.status(403).json({ message: "Access denied: candidates only" });
//   }

//   try {
//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate || !candidate.isPaid) {
//       return res
//         .status(403)
//         .json({ message: "Please complete payment to access this resource" });
//     }

//     req.user.full = candidate;
//     next();
//   } catch (err) {
//     console.error("Paid check error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// export default auth;


// import jwt from "jsonwebtoken";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";

// const auth = async (req, res, next) => {
//   const authHeader = req.header("Authorization") || req.header("authorization");
//   const token = authHeader ? authHeader.split(" ")[1] : null;

//   if (!token) {
//     return res.status(401).json({ msg: "No token, access denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       id: decoded?.user?.id || decoded?.id || decoded?._id,
//       role: decoded?.role || decoded?.user?.role || "user",
//     };

//     // ✅ Check user existence based on role
//     if (req.user.role === "candidate") {
//       const candidate = await Candidate.findById(req.user.id);
//       if (!candidate) return res.status(404).json({ msg: "Candidate not found" });
//     } else if (req.user.role === "employer") {
//       const employer = await Employer.findById(req.user.id);
//       if (!employer) return res.status(404).json({ msg: "Employer not found" });
//     } else if (req.user.role === "admin") {
//       const admin = await Admin.findById(req.user.id);
//       if (!admin) return res.status(404).json({ msg: "Admin not found" });
//     }

//     next();
//   } catch (err) {
//     console.error("Auth error:", err);

//     if (err.name === "TokenExpiredError") {
//       return res.status(401).json({ msg: "Token expired, please login again", expiredAt: err.expiredAt });
//     }

//     if (err.name === "JsonWebTokenError") {
//       return res.status(401).json({ msg: "Invalid token" });
//     }

//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };

// // ✅ Role-based authorization helper
// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied: insufficient role" });
//     }
//     next();
//   };
// };

// // ✅ Paid candidate check helper
// export const checkPaidCandidate = async (req, res, next) => {
//   if (req.user.role !== "candidate") {
//     return res.status(403).json({ message: "Access denied: candidates only" });
//   }

//   try {
//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate || !candidate.isPaid) {
//       return res
//         .status(403)
//         .json({ message: "Please complete payment to access this resource" });
//     }

//     req.user.full = candidate;
//     next();
//   } catch (err) {
//     console.error("Paid check error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// export default auth;




// import jwt from "jsonwebtoken";
// import Candidate from "../models/Candidate.js";
// import Employer from "../models/Employer.js";
// import Admin from "../models/Admin.js";

// const auth = async (req, res, next) => {
//   const authHeader = req.header("Authorization") || req.header("authorization");
//   const token = authHeader ? authHeader.split(" ")[1] : null;

//   if (!token) {
//     return res.status(401).json({ msg: "No token, access denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = {
//       id: decoded?.user?.id || decoded?.id || decoded?._id,
//       role: decoded?.role || decoded?.user?.role || "user",
//     };

//     // ✅ Check user existence based on role
//     if (req.user.role === "candidate") {
//       const candidate = await Candidate.findById(req.user.id);
//       if (!candidate) return res.status(404).json({ msg: "Candidate not found" });
//     } else if (req.user.role === "employer") {
//       const employer = await Employer.findById(req.user.id);
//       if (!employer) return res.status(404).json({ msg: "Employer not found" });
//     } else if (req.user.role === "admin") {
//       const admin = await Admin.findById(req.user.id);
//       if (!admin) return res.status(404).json({ msg: "Admin not found" });
//     }

//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     return res.status(401).json({ msg: "Invalid or expired token" });
//   }
// };

// // ✅ Role-based authorization helper
// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Access denied: insufficient role" });
//     }
//     next();
//   };
// };

// // ✅ Paid candidate check helper
// export const checkPaidCandidate = async (req, res, next) => {
//   if (req.user.role !== "candidate") {
//     return res.status(403).json({ message: "Access denied: candidates only" });
//   }

//   try {
//     const candidate = await Candidate.findById(req.user.id);
//     if (!candidate || !candidate.isPaid) {
//       return res
//         .status(403)
//         .json({ message: "Please complete payment to access this resource" });
//     }

//     req.user.full = candidate;
//     next();
//   } catch (err) {
//     console.error("Paid check error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// export default auth;








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
