const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { requireAdminOr } = require('../middlewares/staffPermission');
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
  getTicketById,
  getSupportContact
} = require('../controllers/ticketController');

// Multer config for error log file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/ticket-logs'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `log-${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.log', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

router.post('/', verifyToken, upload.single('errorLogFile'), createTicket);
router.get('/my', verifyToken, getMyTickets);
// Admin, or a staff member with the matching permission (support role).
router.get('/admin/all', verifyToken, requireAdminOr('tickets_view'), getAllTickets);
router.patch('/admin/:id', verifyToken, requireAdminOr('tickets_update'), updateTicket);
router.get('/:id/support-contact', verifyToken, getSupportContact);
router.get('/:id', verifyToken, getTicketById);

module.exports = router;
