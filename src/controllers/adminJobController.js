import AdminJob from "../models/AdminJob.js";

// ✅ 1. Create Job (Admin only)
export const createAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not logged in" });
    }

    const { title, description, location, salary, company, category, gender, openings } = req.body;

    if (!title || !description || !location || !company || !category || !gender || !openings) {
      return res.status(400).json({ message: "All required fields are mandatory" });
    }

    const newJob = await AdminJob.create({
      title,
      description,
      location,
      salary,
      company,
      category,
      gender,
      openings,
      postedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (err) {
    console.error("Job creation error:", err);
    res.status(500).json({ message: "Server error while creating job", error: err.message });
  }
};

// ✅ 2. Get All Jobs (Public)
export const getAllAdminJobs = async (req, res) => {
  try {
    const jobs = await AdminJob.find().populate("postedBy", "name email");
    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ message: "Server error while fetching jobs", error: err.message });
  }
};

// ✅ 3. Get Single Job by ID (Public)
export const getAdminJobById = async (req, res) => {
  try {
    const job = await AdminJob.findById(req.params.id).populate("postedBy", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ success: true, job });
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).json({ message: "Server error while fetching job", error: err.message });
  }
};

// ✅ 4. Update Job (Admin only)
export const updateAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    const job = await AdminJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // 🧠 Optional: verify that the logged-in admin posted this job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can update only your own job posts" });
    }

    const updatedJob = await AdminJob.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Job updated successfully", job: updatedJob });
  } catch (err) {
    console.error("Error updating job:", err);
    res.status(500).json({ message: "Server error while updating job", error: err.message });
  }
};

// ✅ 5. Delete Job (Admin only)
export const deleteAdminJob = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin not authorized" });
    }

    const job = await AdminJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can delete only your own job posts" });
    }

    await job.deleteOne();
    res.status(200).json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ message: "Server error while deleting job", error: err.message });
  }
};
