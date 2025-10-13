import Contact from "../models/Contact.js";

// PUBLIC: Save contact message
export const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message)
      return res.status(400).json({ error: "All fields are required" });

    const contact = new Contact({ name, email, message });
    await contact.save();

    res.status(200).json({ message: "Message sent successfully!", data: 1 });
  } catch (err) {
    console.error("Error in submitContact:", err);
    res.status(500).json({ error: "Server error", data: null });
  }
};

// ADMIN ONLY: Get all messages
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ data: contacts });
  } catch (err) {
    console.error("Error in getAllContacts:", err);
    res.status(500).json({ error: "Server error", data: null });
  }
};
