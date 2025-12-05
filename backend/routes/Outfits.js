const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Outfit = require("../models/Outfit");

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// List outfits
router.get("/", async (req, res) => {
  const outfits = await Outfit.find().sort({ addedAt: -1 });
  res.json(outfits);
});

// Upload outfit
router.post("/upload", upload.single("image"), async (req, res) => {
  console.log("Upload request received");
  if (!req.file) return res.status(400).json({ error: "image required" });
  const outfit = new Outfit({
    name: req.body.name || req.file.originalname,
    filename: req.file.filename,
  });
  await outfit.save();
  console.log("Outfit saved:", outfit);
  res.json(outfit);
});

module.exports = router;
