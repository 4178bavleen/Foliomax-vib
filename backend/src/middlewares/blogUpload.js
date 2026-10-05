const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/blogs",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only images allowed"), false);
  }
  cb(null, true);
};

module.exports = multer({ storage, fileFilter });
