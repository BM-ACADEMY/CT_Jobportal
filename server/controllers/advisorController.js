const AdvisorReport = require('../models/AdvisorReport');
const AdvisorIdea = require('../models/AdvisorIdea');
const User = require('../models/User');
const Role = require('../models/Role');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const WalkInDrive = require('../models/WalkInDrive');
const SponsorPayment = require('../models/SponsorPayment');
const College = require('../models/College');
const { runAdvisor } = require('../utils/advisorService');
const M = require('../utils/advisorMetrics');
const { GoogleGenerativeAI } = require('../utils/aiHelper');

const HEX = /^[0-9a-fA-F]{24}$/;
const deps = { AdvisorReport, AdvisorIdea, User, Role, Job, Application, Payment, Ticket, College, WalkInDrive, SponsorPayment };

const callAI = async (prompt) => {
  const model = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY).getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json', temperature: 0.3 } });
  return (await model.generateContent(prompt)).response.text();
};

// GET /api/admin/advisor : the latest weekly note, its ideas, and the accepted ideas still to do.
const getAdvisor = async (req, res) => {
  try {
    const latest = await AdvisorReport.findOne({ kind: 'weekly' }).sort({ createdAt: -1 });
    const [ideas, accepted, later, questions] = await Promise.all([
      latest ? AdvisorIdea.find({ report: latest._id }).sort({ createdAt: 1 }) : [],
      AdvisorIdea.find({ status: 'accepted' }).sort({ decidedAt: 1 }),
      AdvisorIdea.find({ status: 'later' }).sort({ decidedAt: -1 }).limit(20),
      AdvisorReport.find({ kind: 'question' }).sort({ createdAt: -1 }).limit(10),
    ]);
    res.json({ latest, ideas, accepted, later, questions, aiEnabled: !!process.env.OPENROUTER_API_KEY || !!process.env.AI_API_KEY });
  } catch (err) { console.error('Advisor get:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/advisor/generate : write this week's note now.
const generate = async (req, res) => {
  try { const r = await runAdvisor({ deps, callAI }); res.status(201).json({ id: r.report._id, capped: r.capped, aiError: r.report.aiError }); }
  catch (err) { console.error('Advisor generate:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/advisor/ask {question}
const ask = async (req, res) => {
  try {
    const question = String(req.body?.question || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (question.length < 5) return res.status(400).json({ msg: 'Please type your question' });
    const r = await runAdvisor({ deps, callAI, question });
    res.status(201).json({ answer: r.report.summary, aiError: r.report.aiError, metrics: r.report.metrics });
  } catch (err) { console.error('Advisor ask:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// POST /api/admin/advisor/ideas/:id {status}
const setIdeaStatus = async (req, res) => {
  try {
    const status = req.body?.status;
    if (!['accepted', 'later', 'rejected', 'done'].includes(status)) return res.status(400).json({ msg: 'Choose accept, later, reject or done' });
    if (!HEX.test(req.params.id || '')) return res.status(404).json({ msg: 'Idea not found' });
    const idea = await AdvisorIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ msg: 'Idea not found' });
    idea.status = status; idea.decidedAt = new Date(); await idea.save();
    res.json({ id: idea._id, status: idea.status });
  } catch (err) { console.error('Advisor idea:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { getAdvisor, generate, ask, setIdeaStatus, deps, callAI };
