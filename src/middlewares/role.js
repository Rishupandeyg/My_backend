import role from "../middlewares/role.js";

// GET all candidates (employer only)
router.get("/all", authMiddleware, role(["employer"]), async (req, res) => {
  try {
    const candidates = await Candidate.find().select("-password");
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});
