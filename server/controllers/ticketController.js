const Ticket = require('../models/Ticket');
const path = require('path');
const fs = require('fs');

// @desc  Raise a new ticket
// @route POST /api/tickets
const createTicket = async (req, res) => {
  try {
    const {
      userRole, accountIdentity, category, diagnostics,
      severity, diagnosticsConsent
    } = req.body;

    let errorLogFile;
    if (req.file) {
      errorLogFile = req.file.filename;
    }

    const diagData = {
      ...(diagnostics || {}),
      ...(errorLogFile ? { errorLogFile } : {})
    };

    const ticket = await Ticket.create({
      user: req.user.id,
      userRole,
      accountIdentity,
      category,
      diagnostics: diagData,
      severity,
      diagnosticsConsent: diagnosticsConsent === true || diagnosticsConsent === 'true'
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Create Ticket Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get current user's tickets
// @route GET /api/tickets/my
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('Get My Tickets Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get all tickets (Admin only)
// @route GET /api/tickets/admin/all
const getAllTickets = async (req, res) => {
  try {
    const { status, category, severity, search } = req.query;
    let query = {};

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (severity && severity !== 'all') query.severity = severity;

    const tickets = await Ticket.find(query)
      .populate('user', 'name email display_id')
      .sort({ createdAt: -1 });

    let result = tickets;
    if (search) {
      const s = search.toLowerCase();
      result = tickets.filter(t =>
        t.user?.name?.toLowerCase().includes(s) ||
        t.user?.email?.toLowerCase().includes(s) ||
        t.accountIdentity?.toLowerCase().includes(s) ||
        t._id.toString().includes(s)
      );
    }

    res.json(result);
  } catch (err) {
    console.error('Get All Tickets Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Update ticket status + conclusion (Admin only)
// @route PATCH /api/tickets/admin/:id
const updateTicket = async (req, res) => {
  try {
    const { status, conclusion } = req.body;
    const update = {};

    if (status) {
      // Conclusion is mandatory for resolved/closed
      if (['resolved', 'closed'].includes(status)) {
        if (!conclusion || conclusion.trim().length < 10) {
          return res.status(400).json({ msg: 'A conclusion message (min 10 characters) is required when resolving or closing a ticket.' });
        }
      }
      update.status = status;
      if (status === 'resolved' || status === 'closed') update.resolvedAt = new Date();
    }

    if (conclusion !== undefined) update.conclusion = conclusion;

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email display_id');

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error('Update Ticket Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc  Get single ticket (user owns it OR admin)
// @route GET /api/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('user', 'name email display_id');
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    // Only owner or admin can view
    if (
      ticket.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(ticket);
  } catch (err) {
    console.error('Get Ticket By ID Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
// @desc  Get support contact (admin id) for messaging
// @route GET /api/tickets/:id/support-contact
const getSupportContact = async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ msg: 'Support not available at the moment.' });
    
    // We just return the first admin found to handle the support chat
    res.json({ adminId: admin._id });
  } catch (err) {
    console.error('Get Support Contact Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicket, getTicketById, getSupportContact };
