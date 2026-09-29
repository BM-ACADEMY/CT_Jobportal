const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces, add timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Allowed types: PDF, Word documents, and images (JPG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// jpg/png land on disk in their original format above; this converts just those to .webp
// afterward. gif is left alone so animated gifs keep their frames, and non-image files
// (pdf/doc) never touch sharp.
const CONVERTIBLE_TYPES = new Set(['.jpg', '.jpeg', '.png']);

const convertFileToWebp = async (file) => {
  const ext = path.extname(file.filename).toLowerCase();
  if (!CONVERTIBLE_TYPES.has(ext)) return;

  const webpFilename = file.filename.slice(0, -ext.length) + '.webp';
  const webpPath = path.join(path.dirname(file.path), webpFilename);

  await sharp(file.path).webp({ quality: 80 }).toFile(webpPath);
  fs.unlinkSync(file.path);

  file.filename = webpFilename;
  file.path = webpPath;
  file.mimetype = 'image/webp';
};

// Chain this after upload.single/array/fields to convert any uploaded jpg/png to webp.
// Safe to apply on routes that also accept non-image files (resumes, docs) since
// convertFileToWebp no-ops on anything that isn't jpg/jpeg/png.
const convertImagesToWebp = async (req, res, next) => {
  try {
    const files = req.file
      ? [req.file]
      : req.files
        ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
        : [];

    for (const file of files) {
      await convertFileToWebp(file);
    }
    next();
  } catch (err) {
    next(err);
  }
};

upload.convertImagesToWebp = convertImagesToWebp;

module.exports = upload;
