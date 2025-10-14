import express from "express";
import auth, { authorizeRoles } from "../middlewares/auth.js";
import {
  createAdminJob,
  getAllAdminJobs,
  getAdminJobById,
  updateAdminJob,
  deleteAdminJob,
} from "../controllers/adminJobController.js";

const router = express.Router();

// 🔒 Admin Protected Routes (specific paths first)
router.post("/post", auth, authorizeRoles("admin"), createAdminJob);
router.put("/update/:id", auth, authorizeRoles("admin"), updateAdminJob);
router.delete("/delete/:id", auth, authorizeRoles("admin"), deleteAdminJob);

// 🧩 Public Routes (generic paths last)
router.get("/", getAllAdminJobs);
router.get("/:id", getAdminJobById);

export default router;




// import express from "express";
// import auth, { authorizeRoles } from "../middlewares/auth.js";
// import {
//   createAdminJob,
//   getAllAdminJobs,
//   getAdminJobById,
//   updateAdminJob,
//   deleteAdminJob,
// } from "../controllers/adminJobController.js";

// const router = express.Router();

// // 🧩 Public Routes
// router.get("/", getAllAdminJobs);
// router.get("/:id", getAdminJobById);

// // 🔒 Admin Protected Routes
// router.post("/post", auth, authorizeRoles("admin"), createAdminJob);
// router.put("/update/:id", auth, authorizeRoles("admin"), updateAdminJob);
// router.delete("/delete/:id", auth, authorizeRoles("admin"), deleteAdminJob);

// export default router;
