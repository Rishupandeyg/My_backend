// import AdminJob from "../models/AdminJob.js";

// // ✅ 1. Create Job (Admin only)
// export const createAdminJob = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ message: "Admin not logged in" });
//     }

//     const { title, description, location, salary, company, category, gender, openings } = req.body;

//     if (!title || !description || !location || !company || !category || !gender || !openings) {
//       return res.status(400).json({ message: "All required fields are mandatory" });
//     }

//     const newJob = await AdminJob.create({
//       title,
//       description,
//       location,
//       salary,
//       company,
//       category,
//       gender,
//       openings,
//       postedBy: req.user.id,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Job posted successfully",
//       job: newJob,
//     });
//   } catch (err) {
//     console.error("Job creation error:", err);
//     res.status(500).json({ message: "Server error while creating job", error: err.message });
//   }
// };

// // ✅ 2. Get All Jobs (Public)
// export const getAllAdminJobs = async (req, res) => {
//   try {
//     const jobs = await AdminJob.find().populate("postedBy", "name email");
//     res.status(200).json({ success: true, count: jobs.length, jobs });
//   } catch (err) {
//     console.error("Error fetching jobs:", err);
//     res.status(500).json({ message: "Server error while fetching jobs", error: err.message });
//   }
// };

// // ✅ 3. Get Single Job by ID (Public)
// export const getAdminJobById = async (req, res) => {
//   try {
//     const job = await AdminJob.findById(req.params.id).populate("postedBy", "name email");
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     res.status(200).json({ success: true, job });
//   } catch (err) {
//     console.error("Error fetching job:", err);
//     res.status(500).json({ message: "Server error while fetching job", error: err.message });
//   }
// };

// // ✅ 4. Update Job (Admin only)
// export const updateAdminJob = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ message: "Admin not authorized" });
//     }

//     const job = await AdminJob.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     // 🧠 Optional: verify that the logged-in admin posted this job
//     if (job.postedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: "You can update only your own job posts" });
//     }

//     const updatedJob = await AdminJob.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.status(200).json({ success: true, message: "Job updated successfully", job: updatedJob });
//   } catch (err) {
//     console.error("Error updating job:", err);
//     res.status(500).json({ message: "Server error while updating job", error: err.message });
//   }
// };

// // ✅ 5. Delete Job (Admin only)
// export const deleteAdminJob = async (req, res) => {
//   try {
//     if (!req.user || req.user.role !== "admin") {
//       return res.status(403).json({ message: "Admin not authorized" });
//     }

//     const job = await AdminJob.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: "Job not found" });

//     if (job.postedBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: "You can delete only your own job posts" });
//     }

//     await job.deleteOne();
//     res.status(200).json({ success: true, message: "Job deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting job:", err);
//     res.status(500).json({ message: "Server error while deleting job", error: err.message });
//   }
// };

// src/controllers/adminJobController.js
import AdminJob from "../models/AdminJob.js";
import JobCategory from "../models/JobCategory.js";

/**
 * Helper to validate ObjectId-ish strings lightly
 */
import mongoose from "mongoose";
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * 1) Create Job (Admin only)
 * Expects body: { title, description, location, salary?, company, categoryId, jobPrice?, gender, openings }
 */
export const createAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not logged in" });
    }

    const {
      title,
      description,
      location,
      salary = "",
      company,
      categoryId,
      jobPrice = null,
      gender,
      openings,
    } = req.body || {};

    // required checks
    const missing = [];
    if (!title) missing.push("title");
    if (!description) missing.push("description");
    if (!location) missing.push("location");
    if (!company) missing.push("company");
    if (!categoryId) missing.push("categoryId");
    if (!gender) missing.push("gender");
    if (typeof openings === "undefined" || openings === null || openings === "") missing.push("openings");

    if (missing.length) {
      return res.status(400).json({ message: "All required fields are mandatory", missingFields: missing });
    }

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    const category = await JobCategory.findById(categoryId).lean();
    if (!category) return res.status(400).json({ message: "Category not found" });

    // parse jobPrice if provided
    const parsedJobPrice =
      jobPrice === null || jobPrice === "" || typeof jobPrice === "undefined"
        ? null
        : Number(jobPrice);

    if (parsedJobPrice !== null && (Number.isNaN(parsedJobPrice) || parsedJobPrice < 0)) {
      return res.status(400).json({ message: "Invalid jobPrice" });
    }

    const categorySnapshot = {
      id: category._id,
      name: category.name,
      fee: typeof category.fee === "number" ? category.fee : 0,
    };

    const finalPrice = parsedJobPrice !== null ? parsedJobPrice : categorySnapshot.fee;

    const job = new AdminJob({
      title: String(title).trim(),
      description: String(description),
      location: String(location),
      salary: String(salary || ""),
      company: String(company).trim(),
      categoryId: category._id,
      categorySnapshot,
      jobPrice: parsedJobPrice,
      finalPrice,
      gender: ["male", "female", "any"].includes(gender) ? gender : "any",
      openings: Number(openings),
      postedBy: req.user._id,
    });

    await job.save();

    return res.status(201).json({ success: true, message: "Job posted successfully", job });
  } catch (err) {
    console.error("createAdminJob error:", err);
    return res.status(500).json({ message: "Server error while creating job", error: err.message });
  }
};

/**
 * 2) Get All Jobs (Public)
 */
export const getAllAdminJobs = async (req, res) => {
  try {
    const jobs = await AdminJob.find()
      .sort({ createdAt: -1 })
      .populate("postedBy", "name email")
      .lean();

    return res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    console.error("getAllAdminJobs error:", err);
    return res.status(500).json({ message: "Server error while fetching jobs", error: err.message });
  }
};

/**
 * 3) Get Single Job by ID (Public)
 */
export const getAdminJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await AdminJob.findById(id).populate("postedBy", "name email").lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    return res.status(200).json({ success: true, job });
  } catch (err) {
    console.error("getAdminJobById error:", err);
    return res.status(500).json({ message: "Server error while fetching job", error: err.message });
  }
};

/**
 * 4) Update Job (Admin only) - allows changing categoryId and/or jobPrice and recalculates snapshot/finalPrice
 */
export const updateAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await AdminJob.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Optional: ensure only creator can update
    if (job.postedBy && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can update only your own job posts" });
    }

    const updates = { ...req.body };

    // If categoryId provided and changed -> validate and update snapshot
    if (updates.categoryId && String(updates.categoryId) !== String(job.categoryId)) {
      if (!isValidObjectId(updates.categoryId)) {
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      const category = await JobCategory.findById(updates.categoryId).lean();
      if (!category) return res.status(400).json({ message: "Category not found" });

      updates.categorySnapshot = {
        id: category._id,
        name: category.name,
        fee: typeof category.fee === "number" ? category.fee : 0,
      };
      updates.categoryId = category._id;
      // If jobPrice not provided or null in this update, use new category fee as finalPrice
      const providedJobPrice = typeof updates.jobPrice !== "undefined" ? updates.jobPrice : job.jobPrice;
      const parsedJobPrice = providedJobPrice === null || providedJobPrice === "" ? null : Number(providedJobPrice);
      updates.jobPrice = parsedJobPrice;
      updates.finalPrice = parsedJobPrice !== null ? parsedJobPrice : updates.categorySnapshot.fee;
    } else {
      // category unchanged - if jobPrice provided, validate and recalc finalPrice
      if (typeof updates.jobPrice !== "undefined") {
        const parsedJobPrice = updates.jobPrice === null || updates.jobPrice === "" ? null : Number(updates.jobPrice);
        if (parsedJobPrice !== null && (Number.isNaN(parsedJobPrice) || parsedJobPrice < 0)) {
          return res.status(400).json({ message: "Invalid jobPrice" });
        }
        updates.jobPrice = parsedJobPrice;
        updates.finalPrice = parsedJobPrice !== null ? parsedJobPrice : job.categorySnapshot?.fee ?? 0;
      }
    }

    // sanitize some fields if present
    if (typeof updates.openings !== "undefined") updates.openings = Number(updates.openings);
    if (typeof updates.gender !== "undefined") updates.gender = ["male", "female", "any"].includes(updates.gender) ? updates.gender : job.gender;

    const updated = await AdminJob.findByIdAndUpdate(id, updates, { new: true }).populate("postedBy", "name email").lean();
    return res.status(200).json({ success: true, message: "Job updated successfully", job: updated });
  } catch (err) {
    console.error("updateAdminJob error:", err);
    return res.status(500).json({ message: "Server error while updating job", error: err.message });
  }
};

/**
 * 5) Delete Job (Admin only)
 */
export const deleteAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid job id" });

    const job = await AdminJob.findById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.postedBy && job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own job posts" });
    }

    await job.deleteOne();
    return res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    console.error("deleteAdminJob error:", err);
    return res.status(500).json({ message: "Server error while deleting job", error: err.message });
  }
};
